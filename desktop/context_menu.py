"""
ScanDoc Desktop Companion - Windows Explorer Context Menu Installer
Safely registers the right-click 'ScanDoc Radial Wheel' command in Windows Explorer.
Uses HKEY_CURRENT_USER so NO Administrator rights are required.
"""

import sys
import os
import winreg
import subprocess
from pathlib import Path


REG_SUBKEYS = [
    r"Software\Classes\*\shell\ScanDoc",
    r"Software\Classes\SystemFileAssociations\.pdf\shell\ScanDoc",
    r"Software\Classes\SystemFileAssociations\.docx\shell\ScanDoc",
    r"Software\Classes\SystemFileAssociations\.doc\shell\ScanDoc",
    r"Software\Classes\SystemFileAssociations\image\shell\ScanDoc",
    r"Software\Classes\Directory\shell\ScanDoc",
]

CLSID_WIN11_OVERRIDE = r"Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}"


def get_command_string() -> str:
    """Determines the exact launch command whether running as a .py script or compiled .exe."""
    if getattr(sys, "frozen", False):
        exe_path = sys.executable
        return f'"{exe_path}" "%1"'
    else:
        python_exe = sys.executable
        radial_script = Path(__file__).resolve().parent / "scandoc_radial.py"
        pythonw_exe = Path(python_exe).with_name("pythonw.exe")
        launcher = str(pythonw_exe) if pythonw_exe.exists() else python_exe
        return f'"{launcher}" "{radial_script}" "%1"'


def install_context_menu() -> bool:
    """Registers ScanDoc in the Windows Explorer right-click menu across all file associations."""
    cmd = get_command_string()
    try:
        for subkey in REG_SUBKEYS:
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, subkey) as key:
                winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "ScanDoc Radial Wheel")
                winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, "shell32.dll,264")
                with winreg.CreateKey(key, "command") as cmd_key:
                    winreg.SetValueEx(cmd_key, "", 0, winreg.REG_SZ, cmd)

        print("[SUCCESS] ScanDoc right-click menu installed across all file associations!")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to install context menu: {e}")
        return False


def uninstall_context_menu() -> bool:
    """Removes ScanDoc from the Windows Explorer right-click menu."""
    success = True
    for subkey in REG_SUBKEYS:
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, f"{subkey}\\command")
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, subkey)
            print(f"[SUCCESS] Removed {subkey}")
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"[ERROR] Could not remove {subkey}: {e}")
            success = False
    return success


def enable_direct_right_click() -> bool:
    """Enables direct 1-click right-click menu on Windows 11 (bypasses 'Show more options')."""
    try:
        inproc_path = f"{CLSID_WIN11_OVERRIDE}\\InprocServer32"
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, inproc_path) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "")
        
        # Restart explorer process so Windows 11 immediately refreshes context menus
        subprocess.run(["powershell", "-Command", "Stop-Process -Name explorer -Force"], capture_output=True)
        print("[SUCCESS] Direct 1-Click Right-Click Menu enabled! No more 'Show more options'.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to enable direct menu: {e}")
        return False


def disable_direct_right_click() -> bool:
    """Restores Windows 11 default context menu style."""
    try:
        inproc_path = f"{CLSID_WIN11_OVERRIDE}\\InprocServer32"
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, inproc_path)
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, CLSID_WIN11_OVERRIDE)
        subprocess.run(["powershell", "-Command", "Stop-Process -Name explorer -Force"], capture_output=True)
        print("[SUCCESS] Restored Windows 11 default menu style.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to restore menu: {e}")
        return False


def is_installed() -> bool:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Classes\*\shell\ScanDoc\command"):
            return True
    except FileNotFoundError:
        return False


def is_direct_enabled() -> bool:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, f"{CLSID_WIN11_OVERRIDE}\\InprocServer32"):
            return True
    except FileNotFoundError:
        return False


if __name__ == "__main__":
    action = sys.argv[1].lower() if len(sys.argv) > 1 else "install"
    if action in ["uninstall", "--uninstall", "-u"]:
        uninstall_context_menu()
    elif action in ["direct", "--direct", "enable-direct"]:
        enable_direct_right_click()
    elif action in ["revert-direct", "--revert-direct"]:
        disable_direct_right_click()
    elif action in ["status", "--status"]:
        print(f"ScanDoc Context Menu Installed: {is_installed()}")
        print(f"Direct 1-Click Right-Click Enabled: {is_direct_enabled()}")
    else:
        install_context_menu()
