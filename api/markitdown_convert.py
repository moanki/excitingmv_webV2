import base64
import io
import json
import os
import re
import time
import urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

from markitdown import MarkItDown
from pdfminer.pdfpage import PDFPage


MAX_PDF_BYTES = 50 * 1024 * 1024
ALLOWED_HOSTS = (".supabase.co", ".google.com", ".googleusercontent.com")


def normalize_markdown(value: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", value.replace("\r\n", "\n").replace("\r", "\n")).strip()


def read_pdf(payload: dict) -> bytes:
    if payload.get("contentBase64"):
        data = base64.b64decode(payload["contentBase64"], validate=True)
    else:
        source_url = str(payload.get("sourceUrl", ""))
        parsed = urlparse(source_url)
        if parsed.scheme != "https" or not any(parsed.hostname and parsed.hostname.endswith(host) for host in ALLOWED_HOSTS):
            raise ValueError("Unsupported PDF source URL.")
        with urllib.request.urlopen(source_url, timeout=60) as response:
            data = response.read(MAX_PDF_BYTES + 1)

    if len(data) > MAX_PDF_BYTES:
        raise ValueError("PDF exceeds the 50 MB conversion limit.")
    if not data.startswith(b"%PDF-"):
        raise ValueError("Uploaded document is not a valid PDF.")
    return data


def conversion_stats(markdown: str, pdf_bytes: bytes, duration_ms: int) -> dict:
    lines = markdown.splitlines()
    try:
        page_count = sum(1 for _ in PDFPage.get_pages(io.BytesIO(pdf_bytes)))
    except Exception:
        page_count = 0
    return {
        "processor": "Microsoft MarkItDown",
        "outputFormat": "Markdown",
        "encoding": "UTF-8",
        "markdownVersion": "GitHub Flavored Markdown",
        "originalFileSize": len(pdf_bytes),
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
        expected = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        supplied = self.headers.get("Authorization", "").removeprefix("Bearer ")
        if not expected or supplied != expected:
            self.send_json(401, {"ok": False, "error": "Unauthorized."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            pdf_bytes = read_pdf(payload)
            started = time.perf_counter()
            result = MarkItDown(enable_plugins=False).convert_stream(
                io.BytesIO(pdf_bytes), file_extension=".pdf"
            )
            markdown = normalize_markdown(result.text_content)
            if not markdown:
                raise ValueError("Microsoft MarkItDown produced no readable content.")
            duration_ms = round((time.perf_counter() - started) * 1000)
            self.send_json(200, {
                "ok": True,
                "markdown": markdown,
                "stats": conversion_stats(markdown, pdf_bytes, duration_ms),
            })
        except Exception as error:
            self.send_json(422, {"ok": False, "error": f"Microsoft MarkItDown conversion failed: {error}"})
