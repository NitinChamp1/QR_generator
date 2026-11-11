"""
ScanDoc Desktop Companion - PyInstaller Executable Builder
Compiles the application into a single standalone 'ScanDoc.exe' that others can download.
"""

import os
import sys
import subprocess
from pathlib import Path


def build():
    desktop_dir = Path(__file__).resolve().parent
    entry_point = desktop_dir / "tray_app.py"
    output_dist = desktop_dir.parent / "dist"

    print("=====================================================")
    print("  SCANDOC // STANDALONE EXECUTABLE BUILDER")
    print("=====================================================")
    print(f"Entry script: {entry_point}")
    print(f"Output folder: {output_dist}")

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onedir",  # onedir is much faster to test, or --onefile for single file
        "--windowed",
        f"--name=ScanDoc",
        f"--distpath={output_dist}",
        f"--workpath={desktop_dir.parent / 'build'}",
        "--hidden-import=PyQt6",
        "--hidden-import=pypdf",
        "--hidden-import=pdf2docx",
        "--hidden-import=fitz",
        "--hidden-import=qrcode",
        "--hidden-import=reportlab",
        "--hidden-import=PIL",
        str(entry_point),
    ]

    print("\nRunning PyInstaller build command...")
    res = subprocess.run(cmd)

    if res.returncode == 0:
        print("\n[SUCCESS] Standalone ScanDoc built successfully!")
        print(f"Executable location: {output_dist / 'ScanDoc' / 'ScanDoc.exe'}")
    else:
        print("\n[ERROR] Build failed with return code:", res.returncode)


if __name__ == "__main__":
    build()
