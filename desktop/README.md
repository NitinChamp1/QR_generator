# ScanDoc Desktop Companion // Radial Wheel Tool

A native Windows desktop companion for **ScanDoc**. Right-click any file in Windows Explorer to trigger a transparent, circular radial wheel directly around your cursor.

---

## ⚡ How It Works

1. **Right-Click Any File** in Windows Explorer (or select and press the hotkey).
2. The **ScanDoc Radial Wheel** appears instantly around your mouse pointer.
3. **Flick your cursor** toward any slice to execute:
   - **PDF Files**: Convert to Word (.docx), Render Pages to Images, Split Every Page, Stamp Watermark, Add Page Numbers, or Open in Web Studio.
   - **Image Files**: OCR to QR, Convert to PDF, Transcode to WEBP, Transcode to JPG, Transcode to PNG, Create multi-res Favicon (.ico).
4. The converted file is saved **immediately in the same folder** with zero uploads, zero server latency, and 100% privacy.

---

## 🚀 Quick Start (Running from Source)

```bash
# 1. Install dependencies
pip install -r desktop/requirements.txt

# 2. Register Windows Explorer Right-Click Menu
python desktop/context_menu.py install

# 3. Test the radial wheel on any file
python desktop/scandoc_radial.py "C:\path\to\your\document.pdf"
```

---

## 📦 Building Standalone `ScanDoc.exe` for Distribution

To distribute to other users who don't have Python installed:

```bash
python desktop/build_exe.py
```

This compiles a standalone `dist/ScanDoc/ScanDoc.exe` that can be zipped and shared via GitHub Releases.
