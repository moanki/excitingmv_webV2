import base64
import io
import json
import os
import re
import time
import http.client
import ipaddress
import socket
import ssl
import zipfile
import hmac
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from urllib.parse import urljoin

from markitdown import MarkItDown
from pdfminer.pdfpage import PDFPage


MAX_DOCUMENT_BYTES = 50 * 1024 * 1024
MAX_JSON_BYTES = 70 * 1024 * 1024


def download_document(source_url: str) -> bytes:
    for _ in range(5):
        parsed = urlparse(source_url)
        project_host = urlparse(os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).hostname
        host = parsed.hostname or ""
        if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port not in (None, 443) or not (
            host in {"drive.google.com", "docs.google.com", "drive.usercontent.google.com", project_host}
            or host.endswith(".googleusercontent.com")
        ):
            raise ValueError("Unsupported document source URL.")
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(entry[4][0]).is_global for entry in addresses):
            raise ValueError("Private document sources are not allowed.")
        # Pin the validated address while validating TLS for the original host.
        address = addresses[0][4][0]
        connection = http.client.HTTPSConnection(host, timeout=30)
        raw_socket = socket.create_connection((address, 443), timeout=30)
        connection.sock = ssl.create_default_context().wrap_socket(raw_socket, server_hostname=host)
        try:
            connection.request("GET", (parsed.path or "/") + ("?" + parsed.query if parsed.query else ""), headers={"Accept-Encoding": "identity"})
            response = connection.getresponse()
            if response.status in {301, 302, 303, 307, 308}:
                source_url = urljoin(source_url, response.getheader("Location", ""))
                continue
            if response.status != 200 or int(response.getheader("Content-Length", "0")) > MAX_DOCUMENT_BYTES:
                raise ValueError("Document cannot be downloaded within the size limit.")
            return response.read(MAX_DOCUMENT_BYTES + 1)
        finally:
            connection.close()
    raise ValueError("Too many document redirects.")


def normalize_markdown(value: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", value.replace("\r\n", "\n").replace("\r", "\n")).strip()


def read_document(payload: dict) -> tuple[bytes, str]:
    extension = str(payload.get("fileExtension") or ".pdf").lower()
    if not extension.startswith("."):
        extension = f".{extension}"
    if extension not in {".pdf", ".xlsx", ".xlsm", ".docx"}:
        raise ValueError("Unsupported document type.")

    if payload.get("contentBase64"):
        if len(payload["contentBase64"]) > MAX_DOCUMENT_BYTES * 4 // 3 + 8:
            raise ValueError("Document exceeds size limit.")
        data = base64.b64decode(payload["contentBase64"], validate=True)
    else:
        data = download_document(str(payload.get("sourceUrl", "")))

    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError("Document exceeds the 50 MB conversion limit.")
    if extension == ".pdf" and not data.startswith(b"%PDF-"):
        raise ValueError("Uploaded document is not a valid PDF.")
    if extension in {".xlsx", ".xlsm", ".docx"} and not data.startswith(b"PK"):
        raise ValueError("Uploaded Office document is not a valid ZIP-based document.")
    if extension in {".xlsx", ".xlsm", ".docx"}:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            if len(entries) > 3000 or sum(entry.file_size for entry in entries) > 100 * 1024 * 1024:
                raise ValueError("Document archive expands beyond the processing limit.")
            if any(entry.file_size > 25 * 1024 * 1024 or entry.file_size > max(entry.compress_size, 1) * 250 for entry in entries):
                raise ValueError("Document archive expansion ratio exceeds the processing limit.")
    if extension == ".pdf":
        for index, _page in enumerate(PDFPage.get_pages(io.BytesIO(data))):
            if index >= 500:
                raise ValueError("PDF exceeds the 500 page processing limit.")
    return data, extension


def conversion_stats(markdown: str, document_bytes: bytes, duration_ms: int, extension: str) -> dict:
    lines = markdown.splitlines()
    try:
        page_count = sum(1 for _ in PDFPage.get_pages(io.BytesIO(document_bytes))) if extension == ".pdf" else 0
    except Exception:
        page_count = 0
    return {
        "processor": "Microsoft MarkItDown",
        "outputFormat": "Markdown",
        "encoding": "UTF-8",
        "markdownVersion": "GitHub Flavored Markdown",
        "originalFileSize": len(document_bytes),
        "pageCount": page_count,
        "markdownSize": len(markdown.encode("utf-8")),
        "markdownCharacters": len(markdown),
        "markdownLines": len(lines),
        "headingsDetected": sum(bool(re.match(r"^#{1,6}\s", line)) for line in lines),
        "tablesDetected": sum(bool(re.match(r"^\s*\|(?:\s*:?-+:?\s*\|)+\s*$", line)) for line in lines),
        "listsDetected": sum(bool(re.match(r"^\s*(?:[-*+] |\d+[.)] )", line)) for line in lines),
        "imagesReferenced": sum(line.count("![") for line in lines),
        "averageCharactersPerPage": round(len(markdown) / page_count) if page_count else None,
        "chunksCreated": 1,
        "chunkStrategy": "Single Markdown document",
        "ocrUsed": False,
        "fallbackUsed": False,
        "conversionDurationMs": duration_ms,
    }


class handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        expected = (os.environ.get("MARKITDOWN_SERVICE_TOKEN") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")).strip()
        supplied = (self.headers.get("X-MarkItDown-Token") or self.headers.get("Authorization", "").removeprefix("Bearer ")).strip()
        if not expected or not hmac.compare_digest(supplied, expected):
            self.send_json(401, {"ok": False, "error": "MarkItDown service authentication failed. Configure the same staging token for the web and Python functions."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_JSON_BYTES:
                raise ValueError("Conversion request exceeds the size limit.")
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Invalid conversion request.")
            document_bytes, extension = read_document(payload)
            started = time.perf_counter()
            result = MarkItDown(enable_plugins=False).convert_stream(
                io.BytesIO(document_bytes), file_extension=extension
            )
            markdown = normalize_markdown(result.text_content)
            if not markdown:
                raise ValueError("Microsoft MarkItDown produced no readable content.")
            duration_ms = round((time.perf_counter() - started) * 1000)
            self.send_json(200, {
                "ok": True,
                "markdown": markdown,
                "stats": conversion_stats(markdown, document_bytes, duration_ms, extension),
            })
        except Exception as error:
            self.send_json(422, {"ok": False, "error": "Microsoft MarkItDown could not process this document within the supported format and size limits."})
