import io
import zipfile

from markitdown import MarkItDown
from openpyxl import Workbook

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


def test_excel_conversion_dependencies():
    workbook = Workbook()
    workbook.active.append(["Resort Name", "Import Center Conversion Check"])
    source = io.BytesIO()
    workbook.save(source)
    for extension in (".xlsx", ".xlsm"):
        result = MarkItDown(enable_plugins=False).convert_stream(
            io.BytesIO(source.getvalue()), file_extension=extension
        )
        assert "Import Center Conversion Check" in result.text_content


def test_word_conversion_dependencies():
    source = io.BytesIO()
    with zipfile.ZipFile(source, "w") as document:
        document.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        document.writestr("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        document.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Import Center Conversion Check</w:t></w:r></w:p></w:body></w:document>')
    result = MarkItDown(enable_plugins=False).convert_stream(
        io.BytesIO(source.getvalue()), file_extension=".docx"
    )
    assert "Import Center Conversion Check" in result.text_content
