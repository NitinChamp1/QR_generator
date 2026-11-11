"""
ScanDoc Desktop Companion - Futuristic Radial Wheel HUD
Hardware-accelerated PyQt6 transparent, circular pie menu.
"""

import sys
import os
import math
from pathlib import Path
from typing import List, Dict, Any, Optional

from PyQt6.QtCore import Qt, QPointF, QRectF, QTimer, QThread, pyqtSignal, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import (
    QPainter,
    QColor,
    QPen,
    QBrush,
    QFont,
    QPainterPath,
    QCursor,
    QGuiApplication,
    QIcon,
)
from PyQt6.QtWidgets import QApplication, QWidget, QLabel

# Import actions
try:
    from desktop.actions import (
        convert_pdf_to_word,
        convert_pdf_to_images,
        split_pdf_pages,
        add_watermark,
        add_page_numbers,
        convert_image,
        convert_image_to_pdf,
        ocr_image_to_qr,
    )
except ImportError:
    from actions import (
        convert_pdf_to_word,
        convert_pdf_to_images,
        split_pdf_pages,
        add_watermark,
        add_page_numbers,
        convert_image,
        convert_image_to_pdf,
        ocr_image_to_qr,
    )


# Palette Constants
COLOR_NAVY = QColor("#1e3d59")
COLOR_CREAM = QColor("#f5f0e1")
COLOR_PANEL_BG = QColor("#fbf9f4")
COLOR_CORAL = QColor("#ff6e40")
COLOR_CORAL_HOVER = QColor("#ff5722")
COLOR_GOLD = QColor("#ffc13b")
COLOR_WHITE = QColor("#ffffff")
COLOR_SHADOW = QColor(30, 61, 89, 45)


class WorkerThread(QThread):
    finished = pyqtSignal(bool, str)

    def __init__(self, action_fn, file_path, *args):
        super().__init__()
        self.action_fn = action_fn
        self.file_path = file_path
        self.args = args

    def run(self):
        try:
            success, msg = self.action_fn(self.file_path, *self.args)
            self.finished.emit(success, msg)
        except Exception as e:
            self.finished.emit(False, str(e))


class RadialMenuWidget(QWidget):
    def __init__(self, target_file_path: Optional[str] = None):
        super().__init__()

        self.target_path = Path(target_file_path).resolve() if target_file_path else None
        self.ext = self.target_path.suffix.lower() if self.target_path else ""
        self.file_name = self.target_path.name if self.target_path else "DEMO FILE"
        self.file_size_str = self.format_file_size()

        # Geometry Settings
        self.diameter = 420
        self.radius = self.diameter / 2
        self.center_x = self.radius
        self.center_y = self.radius
        self.inner_radius = 70.0
        self.outer_radius = 195.0

        # Hover and Selection state
        self.hovered_slice: int = -1
        self.hovered_center: bool = False
        self.is_processing: bool = False
        self.status_message: str = ""
        self.status_is_success: bool = True

        # Build Slices based on file type
        self.slices = self.build_slices()

        # Window Flags: Frameless, Translucent, Always on top, Tool (no taskbar clutter)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setMouseTracking(True)
        self.resize(self.diameter, self.diameter)

        # Position at current mouse cursor
        self.position_at_cursor()

    def format_file_size(self) -> str:
        if not self.target_path or not self.target_path.exists():
            return "0 KB"
        sz = self.target_path.stat().st_size
        if sz < 1024:
            return f"{sz} B"
        elif sz < 1024 * 1024:
            return f"{sz / 1024:.1f} KB"
        else:
            return f"{sz / (1024 * 1024):.1f} MB"

    def position_at_cursor(self):
        cursor_pos = QCursor.pos()
        screen = QGuiApplication.screenAt(cursor_pos) or QGuiApplication.primaryScreen()
        screen_geo = screen.availableGeometry()

        x = cursor_pos.x() - int(self.radius)
        y = cursor_pos.y() - int(self.radius)

        # Clamp within screen bounds
        x = max(screen_geo.left() + 10, min(x, screen_geo.right() - self.diameter - 10))
        y = max(screen_geo.top() + 10, min(y, screen_geo.bottom() - self.diameter - 10))

        self.move(x, y)

    def build_slices(self) -> List[Dict[str, Any]]:
        is_pdf = self.ext == ".pdf"
        is_img = self.ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".ico"]

        if is_pdf:
            return [
                {
                    "title": "TO WORD",
                    "subtitle": ".DOCX",
                    "icon": "📄",
                    "action": convert_pdf_to_word,
                    "args": (),
                },
                {
                    "title": "TO IMAGES",
                    "subtitle": "PNG RENDER",
                    "icon": "🖼️",
                    "action": convert_pdf_to_images,
                    "args": ("png",),
                },
                {
                    "title": "SPLIT PDF",
                    "subtitle": "EVERY PAGE",
                    "icon": "✂️",
                    "action": split_pdf_pages,
                    "args": (),
                },
                {
                    "title": "WATERMARK",
                    "subtitle": "CONFIDENTIAL",
                    "icon": "💧",
                    "action": add_watermark,
                    "args": ("CONFIDENTIAL",),
                },
                {
                    "title": "PAGE NOS",
                    "subtitle": "1 OF N",
                    "icon": "🔢",
                    "action": add_page_numbers,
                    "args": (),
                },
                {
                    "title": "WEB STUDIO",
                    "subtitle": "OPEN BROWSER",
                    "icon": "🌐",
                    "action": self.open_web_suite,
                    "args": (),
                },
            ]
        elif is_img:
            return [
                {
                    "title": "OCR → QR",
                    "subtitle": "SCAN CONTACT",
                    "icon": "📱",
                    "action": ocr_image_to_qr,
                    "args": (),
                },
                {
                    "title": "TO PDF",
                    "subtitle": "DOC EMBED",
                    "icon": "📑",
                    "action": convert_image_to_pdf,
                    "args": (),
                },
                {
                    "title": "TO WEBP",
                    "subtitle": "COMPRESSED",
                    "icon": "⚡",
                    "action": convert_image,
                    "args": ("WEBP",),
                },
                {
                    "title": "TO JPG",
                    "subtitle": "PHOTO STD",
                    "icon": "🖼️",
                    "action": convert_image,
                    "args": ("JPEG",),
                },
                {
                    "title": "TO PNG",
                    "subtitle": "LOSSLESS",
                    "icon": "🎨",
                    "action": convert_image,
                    "args": ("PNG",),
                },
                {
                    "title": "TO ICO",
                    "subtitle": "FAVICON",
                    "icon": "⭐",
                    "action": convert_image,
                    "args": ("ICO",),
                },
            ]
        else:
            return [
                {"title": "OPEN IN WEB", "subtitle": "SCANDOC", "icon": "🌐", "action": self.open_web_suite, "args": ()},
                {"title": "COPY PATH", "subtitle": "CLIPBOARD", "icon": "📋", "action": self.copy_path_action, "args": ()},
                {"title": "TO PDF", "subtitle": "CONVERT", "icon": "📑", "action": convert_image_to_pdf, "args": ()},
                {"title": "DISMISS", "subtitle": "CLOSE", "icon": "✕", "action": self.close_action, "args": ()},
            ]

    def open_web_suite(self, _path: str) -> Tuple[bool, str]:
        import webbrowser
        webbrowser.open("http://localhost:3000")
        return True, "Opened ScanDoc Web Suite"

    def copy_path_action(self, path: str) -> Tuple[bool, str]:
        clipboard = QGuiApplication.clipboard()
        clipboard.setText(path)
        return True, "Path copied to clipboard"

    def close_action(self, _path: str) -> Tuple[bool, str]:
        return True, "Closed"

    # =====================================================================
    # PAINT EVENT - DRAWING THE SWISS RADIAL PIE
    # =====================================================================

    def paintEvent(self, _event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)

        cx = self.center_x
        cy = self.center_y
        num_slices = len(self.slices)
        angle_step = 360.0 / num_slices
        # Start at -90 - half step so slice 0 is centered directly at top (12 o'clock)
        start_offset = -90.0 - (angle_step / 2.0)

        # 1. Outer Soft Shadow Ring
        shadow_path = QPainterPath()
        shadow_path.addEllipse(QPointF(cx, cy), self.outer_radius + 6, self.outer_radius + 6)
        painter.fillPath(shadow_path, COLOR_SHADOW)

        # 2. Draw Each Radial Slice
        for i, s in enumerate(self.slices):
            is_hovered = (self.hovered_slice == i) and not self.is_processing
            start_deg = start_offset + (i * angle_step)

            # Build Donut Sector Path
            slice_path = QPainterPath()
            outer_rect = QRectF(cx - self.outer_radius, cy - self.outer_radius, self.outer_radius * 2, self.outer_radius * 2)
            inner_rect = QRectF(cx - self.inner_radius, cy - self.inner_radius, self.inner_radius * 2, self.inner_radius * 2)

            slice_path.arcMoveTo(outer_rect, -start_deg)
            slice_path.arcTo(outer_rect, -start_deg, -angle_step)
            slice_path.arcTo(inner_rect, -(start_deg + angle_step), angle_step)
            slice_path.closeSubpath()

            # Slice Fill and Border
            if is_hovered:
                painter.fillPath(slice_path, QBrush(COLOR_CORAL))
                pen = QPen(COLOR_NAVY, 2.5)
            else:
                # Alternating soft tone
                bg = COLOR_PANEL_BG if i % 2 == 0 else QColor("#f4f0e6")
                painter.fillPath(slice_path, QBrush(bg))
                pen = QPen(COLOR_NAVY, 2.0)

            painter.setPen(pen)
            painter.drawPath(slice_path)

            # Draw Slice Label and Icon
            mid_angle_deg = start_deg + (angle_step / 2.0)
            mid_rad = math.radians(mid_angle_deg)
            label_radius = (self.inner_radius + self.outer_radius) / 2.0

            text_x = cx + label_radius * math.cos(mid_rad)
            text_y = cy + label_radius * math.sin(mid_rad)

            # Typography
            painter.save()
            painter.translate(text_x, text_y)

            # Icon
            painter.setFont(QFont("Segoe UI Emoji", 15))
            painter.setPen(COLOR_WHITE if is_hovered else COLOR_NAVY)
            painter.drawText(QRectF(-30, -22, 60, 24), Qt.AlignmentFlag.AlignCenter, s.get("icon", "•"))

            # Title
            painter.setFont(QFont("Consolas", 8, QFont.Weight.Bold))
            painter.drawText(QRectF(-50, 2, 100, 14), Qt.AlignmentFlag.AlignCenter, s["title"])

            # Subtitle
            painter.setFont(QFont("Consolas", 7, QFont.Weight.DemiBold))
            painter.setPen(QColor(255, 255, 255, 210) if is_hovered else QColor("#4a637d"))
            painter.drawText(QRectF(-50, 16, 100, 12), Qt.AlignmentFlag.AlignCenter, s.get("subtitle", ""))

            painter.restore()

        # 3. Center Hub (File Information / Status)
        hub_rect = QRectF(cx - self.inner_radius + 4, cy - self.inner_radius + 4, (self.inner_radius - 4) * 2, (self.inner_radius - 4) * 2)
        
        # Center Hub Background
        painter.setBrush(QBrush(COLOR_NAVY))
        painter.setPen(QPen(COLOR_GOLD if self.hovered_center else COLOR_NAVY, 2.5))
        painter.drawEllipse(hub_rect)

        # Center Content
        if self.is_processing:
            painter.setFont(QFont("Consolas", 8, QFont.Weight.Bold))
            painter.setPen(COLOR_GOLD)
            painter.drawText(hub_rect, Qt.AlignmentFlag.AlignCenter, "PROCESSING\nWAIT...")
        elif self.status_message:
            painter.setFont(QFont("Consolas", 8, QFont.Weight.Bold))
            painter.setPen(COLOR_CORAL if not self.status_is_success else COLOR_GOLD)
            painter.drawText(hub_rect, Qt.AlignmentFlag.AlignCenter, self.status_message)
        else:
            # File Extension Pill
            ext_text = self.ext.upper().replace(".", "") or "FILE"
            painter.setFont(QFont("Consolas", 9, QFont.Weight.Black))
            painter.setPen(COLOR_GOLD)
            painter.drawText(QRectF(cx - 45, cy - 32, 90, 16), Qt.AlignmentFlag.AlignCenter, f"[{ext_text}]")

            # File Name (Truncated)
            disp_name = self.file_name
            if len(disp_name) > 13:
                disp_name = disp_name[:11] + ".."
            painter.setFont(QFont("Consolas", 8, QFont.Weight.Bold))
            painter.setPen(COLOR_WHITE)
            painter.drawText(QRectF(cx - 55, cy - 10, 110, 16), Qt.AlignmentFlag.AlignCenter, disp_name)

            # File Size
            painter.setFont(QFont("Consolas", 7, QFont.Weight.Normal))
            painter.setPen(QColor("#a8c5db"))
            painter.drawText(QRectF(cx - 50, cy + 8, 100, 14), Qt.AlignmentFlag.AlignCenter, self.file_size_str)

            # Center Action Hint
            painter.setFont(QFont("Consolas", 6, QFont.Weight.Bold))
            painter.setPen(COLOR_CORAL)
            painter.drawText(QRectF(cx - 50, cy + 24, 100, 12), Qt.AlignmentFlag.AlignCenter, "SCANDOC HUD")

    # =====================================================================
    # MOUSE EVENTS - HIT TESTING & CLICK HANDLING
    # =====================================================================

    def mouseMoveEvent(self, event):
        pos = event.position()
        dx = pos.x() - self.center_x
        dy = pos.y() - self.center_y
        dist = math.hypot(dx, dy)

        prev_hover = self.hovered_slice
        prev_center = self.hovered_center

        if dist < self.inner_radius:
            self.hovered_center = True
            self.hovered_slice = -1
        elif self.inner_radius <= dist <= self.outer_radius:
            self.hovered_center = False
            num_slices = len(self.slices)
            angle_step = 360.0 / num_slices
            start_offset = -90.0 - (angle_step / 2.0)

            deg = math.degrees(math.atan2(dy, dx))
            # Normalize to start_offset reference
            norm_deg = (deg - start_offset) % 360.0
            idx = int(norm_deg // angle_step)
            self.hovered_slice = max(0, min(idx, num_slices - 1))
        else:
            self.hovered_center = False
            self.hovered_slice = -1

        if prev_hover != self.hovered_slice or prev_center != self.hovered_center:
            self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            pos = event.position()
            dx = pos.x() - self.center_x
            dy = pos.y() - self.center_y
            dist = math.hypot(dx, dy)

            # Click outside -> dismiss
            if dist > self.outer_radius + 15:
                self.close()
                return

            # Click center hub -> open web
            if dist < self.inner_radius:
                self.open_web_suite(str(self.target_path) if self.target_path else "")
                self.close()
                return

            # Click slice
            if self.hovered_slice >= 0 and self.hovered_slice < len(self.slices):
                self.trigger_slice(self.hovered_slice)

        elif event.button() == Qt.MouseButton.RightButton:
            # Right click dismisses menu
            self.close()

    def keyPressEvent(self, event):
        if event.key() in (Qt.Key.Key_Escape, Qt.Key.Key_Q):
            self.close()

    def trigger_slice(self, index: int):
        if self.is_processing:
            return

        s = self.slices[index]
        action_fn = s.get("action")
        args = s.get("args", ())

        if not action_fn:
            return

        # Simple actions that don't need threading
        if action_fn in (self.close_action, self.open_web_suite, self.copy_path_action):
            action_fn(str(self.target_path) if self.target_path else "")
            self.close()
            return

        # File processing actions run on background worker thread
        self.is_processing = True
        self.status_message = "RUNNING..."
        self.update()

        self.worker = WorkerThread(action_fn, str(self.target_path), *args)
        self.worker.finished.connect(self.on_action_finished)
        self.worker.start()

    def on_action_finished(self, success: bool, message: str):
        self.is_processing = False
        self.status_is_success = success

        if success:
            self.status_message = "✓ SUCCESS"
            # Auto-close after showing success
            QTimer.singleShot(750, self.close)
        else:
            self.status_message = "FAILED"
            QTimer.singleShot(1500, self.close)

        self.update()


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("ScanDoc Radial HUD")

    # Target file passed as argument (e.g. from Windows Explorer context menu "%1")
    target_file = sys.argv[1] if len(sys.argv) > 1 else None

    # If no file was provided in CLI, create a dummy sample in temp to showcase the HUD
    if not target_file or not os.path.exists(target_file):
        sample_path = Path.home() / "Desktop" / "sample_document.pdf"
        target_file = str(sample_path)

    menu = RadialMenuWidget(target_file)
    menu.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
