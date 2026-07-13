from api.markitdown_convert import MAX_PDF_BYTES, conversion_stats, normalize_markdown


def test_normalization_and_stats():
    assert MAX_PDF_BYTES == 100 * 1024 * 1024
    markdown = normalize_markdown("# Title\r\n\r\n\r\n- One\r\n\r\n| A |\r\n|---|\r\n")
    assert markdown == "# Title\n\n- One\n\n| A |\n|---|"
    stats = conversion_stats(markdown, b"%PDF-test", 12)
    assert stats["headingsDetected"] == 1
    assert stats["listsDetected"] == 1
    assert stats["tablesDetected"] == 1
