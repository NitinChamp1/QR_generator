"""
ScanDoc Desktop Companion - Windows Explorer Context Menu Installer
Safely registers the right-click 'ScanDoc Radial Wheel' command in Windows Explorer.
Uses HKEY_CURRENT_USER so NO Administrator rights are required.
"""

import sys
import os
import winreg
from pathlib import Path


REG_SUBKEY_FILE = r"Software\Classes\*\shell\ScanDoc"
REG_SUBKEY_DIR = r"Software\Classes\Directory\shell\ScanDoc"


def get_command_string() -> str:
    """Determines the exact launch command whether running as a .py script or compiled .exe."""
    if getattr(sys, "frozen", False):
        # Running as PyInstaller compiled executable
        exe_path = sys.executable
        return f'"{exe_path}" "%1"'
    else:
        # Running as Python script
        python_exe = sys.executable
        radial_script = Path(__file__).resolve().parent / "scandoc_radial.py"
        # Use pythonw if available for silent execution without console window
        pythonw_exe = Path(python_exe).with_name("pythonw.exe")
        launcher = str(pythonw_exe) if pythonw_exe.exists() else python_exe
        return f'"{launcher}" "{radial_script}" "%1"'


def install_context_menu() -> bool:
    """Registers ScanDoc in the Windows Explorer right-click menu for all files."""
    cmd = get_command_string()
    try:
        # 1. Register for all files: HKCU\Software\Classes\*\shell\ScanDoc
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, REG_SUBKEY_FILE) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "ScanDoc Radial Wheel")
            winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, "shell32.dll,264")
            with winreg.CreateKey(key, "command") as cmd_key:
                winreg.SetValueEx(cmd_key, "", 0, winreg.REG_SZ, cmd)

        # 2. Register for directories: HKCU\Software\Classes\Directory\shell\ScanDoc
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, REG_SUBKEY_DIR) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "ScanDoc Radial Wheel")
            winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, "shell32.dll,264")
            with winreg.CreateKey(key, "command") as cmd_key:
                winreg.SetValueEx(cmd_key, "", 0, winreg.REG_SZ, cmd)

        print("[SUCCESS] ScanDoc right-click menu installed successfully!")
        print(f"Command configured: {cmd}")
        print("You can now right-click any file in Windows Explorer to open the radial wheel.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to install context menu: {e}")
        return False


def uninstall_context_menu() -> bool:
    """Removes ScanDoc from the Windows Explorer right-click menu."""
    success = True
    for subkey in [REG_SUBKEY_FILE, REG_SUBKEY_DIR]:
        try:
            # Delete child command key first
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, f"{subkey}\\command")
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, subkey)
            print(f"[SUCCESS] Removed {subkey}")
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"[ERROR] Could not remove {subkey}: {e}")
            success = False
    return success


def is_installed() -> bool:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, f"{REG_SUBKEY_FILE}\\command"):
            return True
    except FileNotFoundError:
        return False


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].lower() in ["uninstall", "--uninstall", "-u"]:
        uninstall_context_menu()
    elif len(sys.argv) > 1 and sys.argv[1].lower() in ["status", "--status"]:
        installed = is_installed()
        print(f"ScanDoc Context Menu Installed: {installed}")
    else:
        install_context_menu()
