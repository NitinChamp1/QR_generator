"""
ScanDoc Desktop Companion - File Action Handlers
High-performance offline document & image processing routines.
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Optional, Tuple

# Image processing
from PIL import Image

# PDF processing
import pypdf
from pypdf import PdfReader, PdfWriter

# PDF to Word conversion
try:
    from pdf2docx import Converter as Pdf2DocxConverter
except ImportError:
    Pdf2DocxConverter = None

# PDF to images rendering
try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

# QR code generation
try:
    import qrcode
except ImportError:
    qrcode = None

# OCR extraction
try:
    import pytesseract
except ImportError:
    pytesseract = None


def get_unique_output_path(base_path: Path, tag_or_ext: str) -> Path:
    """Generates an output filename that does not overwrite existing files."""
    if tag_or_ext.startswith("."):
        # Simple extension change (e.g. .docx, .webp)
        base_name = base_path.stem
        ext = tag_or_ext
    elif tag_or_ext.startswith("_"):
        # Tagged suffix (e.g. _watermarked.pdf, _qr.png)
        parts = tag_or_ext.split(".", 1)
        tag = parts[0]
        ext = f".{parts[1]}" if len(parts) > 1 else base_path.suffix
        base_name = f"{base_path.stem}{tag}"
    else:
        base_name = f"{base_path.stem}_{tag_or_ext}"
        ext = base_path.suffix

    candidate = base_path.with_name(f"{base_name}{ext}")
    if not candidate.exists():
        return candidate

    counter = 1
    while True:
        candidate = base_path.with_name(f"{base_name}_{counter}{ext}")
        if not candidate.exists():
            return candidate
        counter += 1


# =====================================================================
# PDF ACTIONS
# =====================================================================

def convert_pdf_to_word(pdf_path: str) -> Tuple[bool, str]:
    """Converts a PDF file to a Microsoft Word .docx file in-place."""
    try:
        p = Path(pdf_path)
        if not p.exists() or p.suffix.lower() != '.pdf':
            return False, f"File not found or not a PDF: {pdf_path}"

        out_path = get_unique_output_path(p, ".docx")

        if Pdf2DocxConverter is not None:
            cv = Pdf2DocxConverter(str(p))
            cv.convert(str(out_path), start=0, end=None)
            cv.close()
            return True, str(out_path.name)
        else:
            from docx import Document
            doc = Document()
            reader = PdfReader(str(p))
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                doc.add_heading(f"Page {i + 1}", level=2)
                doc.add_paragraph(text)
            doc.save(str(out_path))
            return True, str(out_path.name)
    except Exception as e:
        return False, f"PDF to Word error: {str(e)}"


def convert_pdf_to_images(pdf_path: str, fmt: str = "png") -> Tuple[bool, str]:
    """Renders all PDF pages as standalone high-resolution images in a dedicated folder."""
    try:
        p = Path(pdf_path)
        if not p.exists():
            return False, "File does not exist"

        out_dir = p.parent / f"{p.stem}_pages"
        out_dir.mkdir(parents=True, exist_ok=True)

        if fitz is not None:
            doc = fitz.open(str(p))
            count = len(doc)
            for i in range(count):
                page = doc.load_page(i)
                # 2x zoom for sharp high-DPI output
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_out = out_dir / f"page_{i + 1}.{fmt.lower()}"
                pix.save(str(img_out))
            doc.close()
            return True, f"Saved {count} pages to {out_dir.name}/"
        else:
            return False, "PyMuPDF rendering engine not available."
    except Exception as e:
        return False, f"PDF to Images error: {str(e)}"


def split_pdf_pages(pdf_path: str) -> Tuple[bool, str]:
    """Splits each page of the PDF into a separate individual PDF file."""
    try:
        p = Path(pdf_path)
        reader = PdfReader(str(p))
        total = len(reader.pages)
        if total <= 1:
            return False, "PDF only contains 1 page."

        out_dir = p.parent / f"{p.stem}_split"
        out_dir.mkdir(parents=True, exist_ok=True)

        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            out_file = out_dir / f"{p.stem}_p{i + 1}.pdf"
            with open(out_file, "wb") as f:
                writer.write(f)

        return True, f"Split {total} pages to {out_dir.name}/"
    except Exception as e:
        return False, f"Split error: {str(e)}"


def add_watermark(pdf_path: str, text: str = "CONFIDENTIAL") -> Tuple[bool, str]:
    """Stamps a diagonal watermark across all pages of the PDF."""
    try:
        import io
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import Color

        p = Path(pdf_path)
        writer = PdfWriter(clone_from=str(p))
        out_path = get_unique_output_path(p, "_watermarked.pdf")

        for page in writer.pages:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)

            # Generate watermark overlay PDF in memory
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=(width, height))
            can.saveState()
            can.setFont("Helvetica-Bold", 48)
            # Coral Tangerine color with 22% opacity
            can.setFillColor(Color(1.0, 0.43, 0.25, alpha=0.22))
            can.translate(width / 2, height / 2)
            can.rotate(45)
            can.drawCentredString(0, 0, text)
            can.restoreState()
            can.save()

            packet.seek(0)
            watermark_pdf = PdfReader(packet)
            page.merge_page(watermark_pdf.pages[0])

        with open(out_path, "wb") as f:
            writer.write(f)

        return True, str(out_path.name)
    except Exception as e:
        return False, f"Watermark error: {str(e)}"


def add_page_numbers(pdf_path: str) -> Tuple[bool, str]:
    """Adds bottom-centered page numbers ('Page X of Y') across all pages."""
    try:
        import io
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor

        p = Path(pdf_path)
        writer = PdfWriter(clone_from=str(p))
        total = len(writer.pages)
        out_path = get_unique_output_path(p, "_numbered.pdf")

        for i, page in enumerate(writer.pages):
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)

            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=(width, height))
            can.setFont("Courier-Bold", 10)
            # Navy Slate color
            can.setFillColor(HexColor("#1e3d59"))
            page_text = f"- Page {i + 1} of {total} -"
            can.drawCentredString(width / 2, 25, page_text)
            can.save()

            packet.seek(0)
            num_pdf = PdfReader(packet)
            page.merge_page(num_pdf.pages[0])

        with open(out_path, "wb") as f:
            writer.write(f)

        return True, str(out_path.name)
    except Exception as e:
        return False, f"Page numbers error: {str(e)}"


# =====================================================================
# IMAGE ACTIONS
# =====================================================================

def convert_image(img_path: str, target_fmt: str) -> Tuple[bool, str]:
    """Transcodes an image to PNG, JPEG, WEBP, BMP, or ICO (favicon)."""
    try:
        p = Path(img_path)
        if not p.exists():
            return False, "File does not exist"

        target_fmt = target_fmt.upper()
        ext_map = {
            "PNG": ".png",
            "JPEG": ".jpg",
            "JPG": ".jpg",
            "WEBP": ".webp",
            "BMP": ".bmp",
            "ICO": ".ico",
        }
        ext = ext_map.get(target_fmt, f".{target_fmt.lower()}")
        out_path = get_unique_output_path(p, ext)

        with Image.open(str(p)) as im:
            if target_fmt in ("JPEG", "JPG"):
                if im.mode in ("RGBA", "LA", "P"):
                    # Create crisp white background for transparency
                    bg = Image.new("RGB", im.size, (255, 255, 255))
                    bg.paste(im, mask=im.split()[-1] if im.mode == "RGBA" else None)
                    bg.save(str(out_path), "JPEG", quality=95)
                else:
                    im.convert("RGB").save(str(out_path), "JPEG", quality=95)
            elif target_fmt == "ICO":
                # Multi-resolution favicon icon
                im.save(str(out_path), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)])
            elif target_fmt == "WEBP":
                im.save(str(out_path), "WEBP", quality=90)
            elif target_fmt == "PNG":
                im.save(str(out_path), "PNG")
            elif target_fmt == "BMP":
                im.convert("RGB").save(str(out_path), "BMP")
            else:
                im.save(str(out_path), target_fmt)

        return True, str(out_path.name)
    except Exception as e:
        return False, f"Image convert error: {str(e)}"


def convert_image_to_pdf(img_path: str) -> Tuple[bool, str]:
    """Embeds an image into a clean single-page PDF document."""
    try:
        p = Path(img_path)
        out_path = get_unique_output_path(p, ".pdf")
        with Image.open(str(p)) as im:
            rgb_im = im.convert("RGB")
            rgb_im.save(str(out_path), "PDF", resolution=100.0)
        return True, str(out_path.name)
    except Exception as e:
        return False, f"Image to PDF error: {str(e)}"


def ocr_image_to_qr(img_path: str) -> Tuple[bool, str]:
    """Runs OCR on image to extract text or contact info, then generates a QR PNG next to it."""
    try:
        if qrcode is None:
            return False, "qrcode library not available"

        p = Path(img_path)
        raw_text = ""

        # Attempt OCR if pytesseract is available
        if pytesseract is not None:
            try:
                with Image.open(str(p)) as im:
                    raw_text = pytesseract.image_to_string(im).strip()
            except Exception:
                raw_text = ""

        payload = raw_text if raw_text else f"File: {p.name}"

        # Generate QR matrix
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        # Style in ScanDoc Coral / Navy palette
        img_qr = qr.make_image(fill_color="#1e3d59", back_color="#ffffff")
        out_path = get_unique_output_path(p, "_qr.png")
        img_qr.save(str(out_path))

        return True, str(out_path.name)
    except Exception as e:
        return False, f"OCR to QR error: {str(e)}"
