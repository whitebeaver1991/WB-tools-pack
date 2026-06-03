#pragma once

#include <windows.h>

#define SEARCH_PANEL_WIDTH      480
#define SEARCH_PANEL_HEIGHT     520
#define SEARCH_INPUT_HEIGHT     44
#define SEARCH_ITEM_HEIGHT      32
#define SEARCH_TIMEOUT_MS       5000

void RegisterSearchOverlayClass(HINSTANCE hInstance);
void ShowSearchOverlay(HWND parent_hwnd);
void DestroySearchOverlay();
