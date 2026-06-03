#pragma once

#include <windows.h>

struct PieSector {
    float   start_angle;
    float   end_angle;
    RECT    label_rect;
};

void RegisterPieOverlayClass(HINSTANCE hInstance);
void ShowPieOverlay(HWND parent_hwnd);
void DestroyPieOverlay();
