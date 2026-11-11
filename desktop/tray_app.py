"""
ScanDoc Desktop Companion - System Tray & Launcher Entrypoint
Provides tray icon, hotkey launcher, and direct context-menu execution.
"""

import sys
import os
from pathlib import Path
import webbrowser

from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon, QAction, QPixmap, QPainter, QColor
from PyQt6.QtWidgets import (
    QApplication,
    QSystemTrayIcon,
    QMenu,
    QMessageBox,
)

try:
    from desktop.scandoc_radial import RadialMenuWidget
    from desktop.context_menu import install_context_menu, uninstall_context_menu, is_installed
except ImportError:
    from scandoc_radial import RadialMenuWidget
    from context_menu import install_context_menu, uninstall_context_menu, is_installed


def create_tray_icon() -> QIcon:
    """Generates a branded circular ScanDoc icon for the system tray."""
    pix = QPixmap(32, 32)
    pix.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pix)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

    # Outer circle in Deep Navy
    painter.setBrush(QColor("#1e3d59"))
    painter.setPen(QColor("#ff6e40"))
    painter.drawEllipse(2, 2, 28, 28)

    # Inner badge in Coral Tangerine
    painter.setBrush(QColor("#ff6e40"))
    painter.setPen(Qt.PenStyle.NoPen)
    painter.drawEllipse(10, 10, 12, 12)
    painter.end()
    return QIcon(pix)


class ScanDocTrayApp:
    def __init__(self, app: QApplication):
        self.app = app
        self.active_wheel = None

        self.tray = QSystemTrayIcon(create_tray_icon(), self.app)
        self.tray.setToolTip("ScanDoc - Radial Document Companion")

        # Context menu
        self.menu = QMenu()

        self.act_test = QAction("Open Radial Wheel (Demo)", self.menu)
        self.act_test.triggered.connect(self.show_demo_wheel)
        self.menu.addAction(self.act_test)

        self.menu.addSeparator()

        self.act_toggle_reg = QAction(
            "Disable Right-Click Menu" if is_installed() else "Enable Right-Click Menu",
            self.menu,
        )
        self.act_toggle_reg.triggered.connect(self.toggle_context_menu)
        self.menu.addAction(self.act_toggle_reg)

        self.act_web = QAction("Open ScanDoc Web Suite", self.menu)
        self.act_web.triggered.connect(lambda: webbrowser.open("http://localhost:3000"))
        self.menu.addAction(self.act_web)

        self.menu.addSeparator()

        self.act_exit = QAction("Exit ScanDoc", self.menu)
        self.act_exit.triggered.connect(self.app.quit)
        self.menu.addAction(self.act_exit)

        self.tray.setContextMenu(self.menu)
        self.tray.show()

    def show_demo_wheel(self):
        # Create a sample demo path for testing
        sample_path = Path.home() / "Desktop" / "demo_document.pdf"
        self.active_wheel = RadialMenuWidget(str(sample_path))
        self.active_wheel.show()

    def toggle_context_menu(self):
        if is_installed():
            uninstall_context_menu()
            self.act_toggle_reg.setText("Enable Right-Click Menu")
            self.tray.showMessage(
                "ScanDoc",
                "Windows right-click menu has been removed.",
                QSystemTrayIcon.MessageIcon.Information,
                2000,
            )
        else:
            install_context_menu()
            self.act_toggle_reg.setText("Disable Right-Click Menu")
            self.tray.showMessage(
                "ScanDoc",
                "Windows right-click menu is active! Right-click any file to see the radial wheel.",
                QSystemTrayIcon.MessageIcon.Information,
                2500,
            )


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("ScanDoc Desktop")
    app.setQuitOnLastWindowClosed(False)

    # If called with a file argument (e.g. from Windows Explorer context menu)
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        file_path = sys.argv[1]
        app.setQuitOnLastWindowClosed(True)
        wheel = RadialMenuWidget(file_path)
        wheel.show()
        sys.exit(app.exec())

    # Otherwise run as background tray companion
    tray = ScanDocTrayApp(app)
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
