#include "WB_PieMenu.h"

void DrawGuideLine(HDC dc, int cx, int cy) {
    if (!g_guideEnabled) return;
    HPEN gp = CreatePen(PS_SOLID, g_guideWidth, g_guideColor);
    HPEN oldPen = (HPEN)SelectObject(dc, gp);
    MoveToEx(dc, cx, cy, NULL);
    LineTo(dc, g_mouseX, g_mouseY);
    SelectObject(dc, oldPen);
    DeleteObject(gp);
}
