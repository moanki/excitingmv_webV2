from api.markitdown_convert import MAX_DOCUMENT_BYTES, conversion_stats, normalize_markdown, read_document


def test_normalization_and_stats():
    assert MAX_DOCUMENT_BYTES == 50 * 1024 * 1024
    markdown = normalize_markdown("# Title\r\n\r\n\r\n- One\r\n\r\n| A |\r\n|---|\r\n")
    assert markdown == "# Title\n\n- One\n\n| A |\n|---|"
    stats = conversion_stats(markdown, b"%PDF-test", 12, ".pdf")
    assert stats["headingsDetected"] == 1
    assert stats["listsDetected"] == 1
    assert stats["tablesDetected"] == 1


def test_office_document_validation():
    import base64
    import io
    import zipfile
    import pytest
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("workbook.xml", "<workbook/>")
    content = stream.getvalue()
    document, extension = read_document({"fileExtension": ".xlsx", "contentBase64": base64.b64encode(content).decode()})
    assert document == content
    assert extension == ".xlsx"
    with pytest.raises(zipfile.BadZipFile):
        read_document({"fileExtension": ".xlsx", "contentBase64": "UEs="})


def test_rejects_unapproved_and_private_document_sources():
    import pytest
    from api.markitdown_convert import download_document
    for value in ["http://127.0.0.1/file.pdf", "https://example.com/file.pdf?source=drive.google.com", "https://drive.google.com.evil.invalid/file.pdf"]:
        with pytest.raises(ValueError):
            download_document(value)
