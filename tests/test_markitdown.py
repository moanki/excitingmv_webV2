from api.markitdown_convert import MAX_DOCUMENT_BYTES, conversion_stats, normalize_markdown, read_document


def test_normalization_and_stats():
    assert MAX_DOCUMENT_BYTES == 100 * 1024 * 1024
    markdown = normalize_markdown("# Title\r\n\r\n\r\n- One\r\n\r\n| A |\r\n|---|\r\n")
    assert markdown == "# Title\n\n- One\n\n| A |\n|---|"
    stats = conversion_stats(markdown, b"%PDF-test", 12, ".pdf")
    assert stats["headingsDetected"] == 1
    assert stats["listsDetected"] == 1
    assert stats["tablesDetected"] == 1


def test_office_document_validation():
    document, extension = read_document({"fileExtension": ".xlsx", "contentBase64": "UEs="})
    assert document == b"PK"
    assert extension == ".xlsx"
