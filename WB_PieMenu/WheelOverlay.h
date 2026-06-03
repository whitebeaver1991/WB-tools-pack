#pragma once

#include <windows.h>

#define WHEEL_BAR_HEIGHT    80
#define WHEEL_ITEM_WIDTH    140
#define WHEEL_VISIBLE_ITEMS 5
#define WHEEL_TIMEOUT_MS    3000

void RegisterWheelOverlayClass(HINSTANCE hInstance);
void ShowWheelOverlay(HWND parent_hwnd);
void DestroyWheelOverlay();
