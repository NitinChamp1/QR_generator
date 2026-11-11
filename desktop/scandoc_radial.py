"""
ScanDoc Desktop Companion - Compact Minimalist Radial Wheel HUD
Refined, small, modern circular pie menu (260px diameter).
"""

import sys
import os
import math
from pathlib import Path
from typing import List, Dict, Any, Optional

from PyQt6.QtCore import Qt, QPointF, QRectF, QTimer, QThread, pyqtSignal
from PyQt6.QtGui import (
    QPainter,
    QColor,
    QPen,
    QBrush,
    QFont,
    QPainterPath,
    QCursor,
    QGuiApplication,
)
from PyQt6.QtWidgets import QApplication, QWidget

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


# Swiss Industrial Palette Constants
COLOR_NAVY = QColor("#1e3d59")
COLOR_CREAM = QColor("#f5f0e1")
COLOR_PANEL_BG = QColor("#fdfcf9")
COLOR_PANEL_ALT = QColor("#f4f0e6")
COLOR_CORAL = QColor("#ff6e40")
COLOR_GOLD = QColor("#ffc13b")
COLOR_WHITE = QColor("#ffffff")
COLOR_MUTED = QColor("#4a637d")
COLOR_SHADOW = QColor(30, 61, 89, 40)


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
        self.file_name = self.target_path.name if self.target_path else "DOCUMENT"
        self.file_size_str = self.format_file_size()

        # COMPACT MINIMAL GEOMETRY (260px total diameter)
        self.diameter = 260
        self.radius = self.diameter / 2.0
        self.center_x = self.radius
        self.center_y = self.radius
        self.inner_radius = 42.0   # Compact Center Hub
        self.outer_radius = 124.0  # Sleek Outer Perimeter

        # State
        self.hovered_slice: int = -1
        self.hovered_center: bool = False
        self.is_processing: bool = False
        self.status_message: str = ""
        self.status_is_success: bool = True

        # Build Slices based on file type
        self.slices = self.build_slices()

        # Frameless, Translucent, Tool window (no taskbar icon)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setMouseTracking(True)
        self.resize(self.diameter, self.diameter)

        # Center at cursor position
        self.position_at_cursor()

    def format_file_size(self) -> str:
        if not self.target_path or not self.target_path.exists():
            return "0 KB"
        sz = self.target_path.stat().st_size
        if sz < 1024:
            return f"{sz} B"
        elif sz < 1024 * 1024:
            return f"{sz / 1024:.0f} KB"
        else:
            return f"{sz / (1024 * 1024):.1f} MB"

    def position_at_cursor(self):
        cursor_pos = QCursor.pos()
        screen = QGuiApplication.screenAt(cursor_pos) or QGuiApplication.primaryScreen()
        screen_geo = screen.availableGeometry()

        x = cursor_pos.x() - int(self.radius)
        y = cursor_pos.y() - int(self.radius)

        # Clamp within visible screen boundaries
        x = max(screen_geo.left() + 8, min(x, screen_geo.right() - self.diameter - 8))
        y = max(screen_geo.top() + 8, min(y, screen_geo.bottom() - self.diameter - 8))

        self.move(x, y)

    def build_slices(self) -> List[Dict[str, Any]]:
        is_pdf = self.ext == ".pdf"
        is_img = self.ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".ico"]

        if is_pdf:
            return [
                {"title": "WORD", "icon": "📄", "action": convert_pdf_to_word, "args": ()},
                {"title": "IMAGES", "icon": "🖼️", "action": convert_pdf_to_images, "args": ("png",)},
                {"title": "SPLIT", "icon": "✂️", "action": split_pdf_pages, "args": ()},
                {"title": "WATERMARK", "icon": "💧", "action": add_watermark, "args": ("CONFIDENTIAL",)},
                {"title": "PAGE NO", "icon": "🔢", "action": add_page_numbers, "args": ()},
                {"title": "STUDIO", "icon": "🌐", "action": self.open_web_suite, "args": ()},
            ]
        elif is_img:
            return [
                {"title": "OCR → QR", "icon": "📱", "action": ocr_image_to_qr, "args": ()},
                {"title": "PDF", "icon": "📑", "action": convert_image_to_pdf, "args": ()},
                {"title": "WEBP", "icon": "⚡", "action": convert_image, "args": ("WEBP",)},
                {"title": "JPG", "icon": "🖼️", "action": convert_image, "args": ("JPEG",)},
                {"title": "PNG", "icon": "🎨", "action": convert_image, "args": ("PNG",)},
                {"title": "ICO", "icon": "⭐", "action": convert_image, "args": ("ICO",)},
            ]
        else:
            return [
                {"title": "STUDIO", "icon": "🌐", "action": self.open_web_suite, "args": ()},
                {"title": "COPY PATH", "icon": "📋", "action": self.copy_path_action, "args": ()},
                {"title": "TO PDF", "icon": "📑", "action": convert_image_to_pdf, "args": ()},
                {"title": "CLOSE", "icon": "✕", "action": self.close_action, "args": ()},
            ]

    def open_web_suite(self, _path: str) -> tuple[bool, str]:
        import webbrowser
        webbrowser.open("http://localhost:3000")
        return True, "Opened ScanDoc Web Suite"

    def copy_path_action(self, path: str) -> tuple[bool, str]:
        clipboard = QGuiApplication.clipboard()
        clipboard.setText(path)
        return True, "Path copied"

    def close_action(self, _path: str) -> tuple[bool, str]:
        return True, "Closed"

    # =====================================================================
    # COMPACT MINIMAL PAINT EVENT
    # =====================================================================

    def paintEvent(self, _event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)

        cx = self.center_x
        cy = self.center_y
        num_slices = len(self.slices)
        angle_step = 360.0 / num_slices
        # Slice 0 centered at 12 o'clock
        start_offset = -90.0 - (angle_step / 2.0)

        # 1. Subtle Outer Ambient Shadow
        shadow_path = QPainterPath()
        shadow_path.addEllipse(QPointF(cx, cy), self.outer_radius + 4, self.outer_radius + 4)
        painter.fillPath(shadow_path, COLOR_SHADOW)

        # 2. Draw Slices
        for i, s in enumerate(self.slices):
            is_hovered = (self.hovered_slice == i) and not self.is_processing
            start_deg = start_offset + (i * angle_step)

            # Donut Sector Path
            slice_path = QPainterPath()
            outer_rect = QRectF(cx - self.outer_radius, cy - self.outer_radius, self.outer_radius * 2, self.outer_radius * 2)
            inner_rect = QRectF(cx - self.inner_radius, cy - self.inner_radius, self.inner_radius * 2, self.inner_radius * 2)

            slice_path.arcMoveTo(outer_rect, -start_deg)
            slice_path.arcTo(outer_rect, -start_deg, -angle_step)
            slice_path.arcTo(inner_rect, -(start_deg + angle_step), angle_step)
            slice_path.closeSubpath()

            # Fill & Stroke
            if is_hovered:
                painter.fillPath(slice_path, QBrush(COLOR_CORAL))
                painter.setPen(QPen(COLOR_NAVY, 2.0))
            else:
                bg = COLOR_PANEL_BG if i % 2 == 0 else COLOR_PANEL_ALT
                painter.fillPath(slice_path, QBrush(bg))
                painter.setPen(QPen(COLOR_NAVY, 1.5))

            painter.drawPath(slice_path)

            # Slice Content Positioning
            mid_angle_deg = start_deg + (angle_step / 2.0)
            mid_rad = math.radians(mid_angle_deg)
            label_radius = (self.inner_radius + self.outer_radius) / 2.0

            text_x = cx + label_radius * math.cos(mid_rad)
            text_y = cy + label_radius * math.sin(mid_rad)

            painter.save()
            painter.translate(text_x, text_y)

            # Minimal Icon
            painter.setFont(QFont("Segoe UI Emoji", 12))
            painter.setPen(COLOR_WHITE if is_hovered else COLOR_NAVY)
            painter.drawText(QRectF(-20, -18, 40, 18), Qt.AlignmentFlag.AlignCenter, s.get("icon", "•"))

            # Minimal Label
            painter.setFont(QFont("Consolas", 7, QFont.Weight.Bold))
            painter.setPen(COLOR_WHITE if is_hovered else COLOR_NAVY)
            painter.drawText(QRectF(-35, 1, 70, 13), Qt.AlignmentFlag.AlignCenter, s["title"])

            painter.restore()

        # 3. Compact Center Hub
        hub_rect = QRectF(cx - self.inner_radius + 3, cy - self.inner_radius + 3, (self.inner_radius - 3) * 2, (self.inner_radius - 3) * 2)

        painter.setBrush(QBrush(COLOR_NAVY))
        painter.setPen(QPen(COLOR_GOLD if self.hovered_center else COLOR_NAVY, 2.0))
        painter.drawEllipse(hub_rect)

        # Center Content
        if self.is_processing:
            painter.setFont(QFont("Consolas", 7, QFont.Weight.Bold))
            painter.setPen(COLOR_GOLD)
            painter.drawText(hub_rect, Qt.AlignmentFlag.AlignCenter, "WORKING...")
        elif self.status_message:
            painter.setFont(QFont("Consolas", 7, QFont.Weight.Bold))
            painter.setPen(COLOR_CORAL if not self.status_is_success else COLOR_GOLD)
            painter.drawText(hub_rect, Qt.AlignmentFlag.AlignCenter, self.status_message)
        else:
            # File Extension Badge
            ext_text = self.ext.upper().replace(".", "") or "FILE"
            painter.setFont(QFont("Consolas", 8, QFont.Weight.Black))
            painter.setPen(COLOR_GOLD)
            painter.drawText(QRectF(cx - 30, cy - 22, 60, 14), Qt.AlignmentFlag.AlignCenter, f"[{ext_text}]")

            # File Name
            disp_name = self.file_name
            if len(disp_name) > 9:
                disp_name = disp_name[:7] + ".."
            painter.setFont(QFont("Consolas", 7, QFont.Weight.Bold))
            painter.setPen(COLOR_WHITE)
            painter.drawText(QRectF(cx - 36, cy - 7, 72, 13), Qt.AlignmentFlag.AlignCenter, disp_name)

            # Size
            painter.setFont(QFont("Consolas", 6, QFont.Weight.Normal))
            painter.setPen(QColor("#a8c5db"))
            painter.drawText(QRectF(cx - 30, cy + 6, 60, 11), Qt.AlignmentFlag.AlignCenter, self.file_size_str)

    # =====================================================================
    # MOUSE EVENTS
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
            if dist > self.outer_radius + 10:
                self.close()
                return

            # Click center hub -> open web
            if dist < self.inner_radius:
                self.open_web_suite(str(self.target_path) if self.target_path else "")
                self.close()
                return

            # Click slice
            if 0 <= self.hovered_slice < len(self.slices):
                self.trigger_slice(self.hovered_slice)

        elif event.button() == Qt.MouseButton.RightButton:
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

        if action_fn in (self.close_action, self.open_web_suite, self.copy_path_action):
            action_fn(str(self.target_path) if self.target_path else "")
            self.close()
            return

        self.is_processing = True
        self.status_message = "RUNNING..."
        self.update()

        self.worker = WorkerThread(action_fn, str(self.target_path), *args)
        self.worker.finished.connect(self.on_action_finished)
        self.worker.start()

    def on_action_finished(self, success: bool, _message: str):
        self.is_processing = False
        self.status_is_success = success
        self.status_message = "✓ DONE" if success else "FAILED"
        self.update()
        QTimer.singleShot(650, self.close)


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("ScanDoc Radial HUD")

    target_file = sys.argv[1] if len(sys.argv) > 1 else None
    if not target_file or not os.path.exists(target_file):
        sample_path = Path.home() / "Desktop" / "sample_document.pdf"
        target_file = str(sample_path)

    menu = RadialMenuWidget(target_file)
    menu.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
