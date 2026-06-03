#include "SearchOverlay.h"
#include "EffectData.h"
#include <commctrl.h>
#include <string.h>
#include <cwchar>

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "user32.lib")

static const char* SEARCH_WND_CLASS = "WB_SearchOverlay";

static HWND g_search_hwnd = NULL;
static HWND g_search_parent = NULL;
static HINSTANCE g_search_hInst = NULL;

#define SEARCH_TIMER_CLOSE   3001
#define SEARCH_TIMER_INPUT   3002

static const PieEffect* g_all_effects = NULL;
static int g_total_effects = 0;

static int g_filtered_count = 0;
static int g_filtered_indices[256];
static int g_search_highlight = 0;
static wchar_t g_search_buffer[64];
static int g_search_len = 0;

static void FilterEffects(const wchar_t* query, int* out_count, int* out_indices, int max_results)
{
    *out_count = 0;
    if (!query || query[0] == L'\0') {
        int limit = g_total_effects < max_results ? g_total_effects : max_results;
        for (int i = 0; i < limit; i++) {
            out_indices[*out_count] = i;
            (*out_count)++;
        }
        return;
    }

    for (int i = 0; i < g_total_effects && *out_count < max_results; i++) {
        const wchar_t* label = g_all_effects[i].label;
        const wchar_t* match = g_all_effects[i].matchName;

        if (wcsstr(label, query) || wcsstr(match, query)) {
            out_indices[*out_count] = i;
            (*out_count)++;
        }
    }
}

static void RenderSearchPanel(HDC hdc, int width, int height)
{
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, width, height);
    SelectObject(memDC, bmp);

    SetBkMode(memDC, TRANSPARENT);

    HBRUSH bgBrush = CreateSolidBrush(RGB(28, 28, 32));
    RECT bgRect = { 0, 0, width, height };
    FillRect(memDC, &bgRect, bgBrush);
    DeleteObject(bgBrush);

    HPEN borderPen = CreatePen(PS_SOLID, 1, RGB(55, 55, 60));
    HBRUSH noBrush = (HBRUSH)GetStockObject(NULL_BRUSH);
    SelectObject(memDC, borderPen);
    SelectObject(memDC, noBrush);
    RoundRect(memDC, 8, 8, width - 9, height - 9, 12, 12);
    DeleteObject(borderPen);

    RECT inputRect = { 16, 16, width - 16, 16 + SEARCH_INPUT_HEIGHT };
    HBRUSH inputBg = CreateSolidBrush(RGB(38, 38, 42));
    FillRect(memDC, &inputRect, inputBg);
    DeleteObject(inputBg);

    HPEN inputBorder = CreatePen(PS_SOLID, 1, RGB(60, 60, 68));
    SelectObject(memDC, inputBorder);
    noBrush = (HBRUSH)GetStockObject(NULL_BRUSH);
    SelectObject(memDC, noBrush);
    RoundRect(memDC, inputRect.left, inputRect.top, inputRect.right - 1, inputRect.bottom - 1, 6, 6);
    DeleteObject(inputBorder);

    SetTextColor(memDC, RGB(220, 220, 220));
    HFONT inputFont = CreateFontW(20, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
    HFONT oldFont = (HFONT)SelectObject(memDC, inputFont);
    SetTextAlign(memDC, TA_LEFT | TA_BASELINE);

    if (g_search_len > 0) {
        TextOutW(memDC, inputRect.left + 8, inputRect.top + (SEARCH_INPUT_HEIGHT - 20) / 2 + 2,
            g_search_buffer, g_search_len);
    } else {
        SetTextColor(memDC, RGB(120, 120, 130));
        TextOutW(memDC, inputRect.left + 8, inputRect.top + (SEARCH_INPUT_HEIGHT - 20) / 2 + 2,
            L"\u641C\u7D22\u7279\u6548\u540D\u79F0... (\u652F\u6301\u62FC\u97F3/\u82F1\u6587)", 27);
    }

    SelectObject(memDC, oldFont);
    DeleteObject(inputFont);

    int list_y = inputRect.bottom + 8;
    int list_h = height - list_y - 16;

    for (int i = 0; i < g_filtered_count; i++) {
        int y = list_y + i * SEARCH_ITEM_HEIGHT;
        if (y + SEARCH_ITEM_HEIGHT > height - 8) break;

        if (i == g_search_highlight) {
            HBRUSH hlBrush = CreateSolidBrush(RGB(50, 100, 210));
            RECT hlRect = { 16, y, width - 16, y + SEARCH_ITEM_HEIGHT };
            FillRect(memDC, &hlRect, hlBrush);
            DeleteObject(hlBrush);
        }

        int effect_idx = g_filtered_indices[i];
        SetTextColor(memDC, (i == g_search_highlight) ? RGB(255, 255, 255) : RGB(200, 200, 200));

        HFONT itemFont = CreateFontW(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
        HFONT oldItemFont = (HFONT)SelectObject(memDC, itemFont);
        SetTextAlign(memDC, TA_LEFT | TA_BASELINE);
        TextOutW(memDC, 24, y + (SEARCH_ITEM_HEIGHT - 16) / 2 + 2,
            g_all_effects[effect_idx].label, (int)wcslen(g_all_effects[effect_idx].label));
        SelectObject(memDC, oldItemFont);
        DeleteObject(itemFont);
    }

    wchar_t info_text[64];
    swprintf_s(info_text, L"\u5171 %d \u4E2A\u7ED3\u679C  |  \u2191\u2193 \u9009\u62E9  |  Enter \u786E\u5B9A  |  Esc \u5173\u95ED",
        g_filtered_count);
    SetTextColor(memDC, RGB(100, 100, 110));
    HFONT infoFont = CreateFontW(11, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
    HFONT oldInfoFont = (HFONT)SelectObject(memDC, infoFont);
    SetTextAlign(memDC, TA_LEFT | TA_BASELINE);
    TextOutW(memDC, 20, height - 20, info_text, (int)wcslen(info_text));
    SelectObject(memDC, oldInfoFont);
    DeleteObject(infoFont);

    BitBlt(hdc, 0, 0, width, height, memDC, 0, 0, SRCCOPY);

    DeleteObject(bmp);
    DeleteDC(memDC);
}

static LRESULT CALLBACK SearchOverlayProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch (msg) {

    case WM_CREATE:
        SetTimer(hwnd, SEARCH_TIMER_CLOSE, SEARCH_TIMEOUT_MS, NULL);
        SetTimer(hwnd, SEARCH_TIMER_INPUT, 100, NULL);
        SetFocus(hwnd);
        return 0;

    case WM_TIMER:
        if (wParam == SEARCH_TIMER_CLOSE) {
            DestroyWindow(hwnd);
        }
        return 0;

    case WM_CHAR: {
        wchar_t ch = (wchar_t)wParam;
        if (ch == VK_RETURN) {
            if (g_filtered_count > 0 && g_search_highlight >= 0 && g_search_highlight < g_filtered_count) {
                int idx = g_filtered_indices[g_search_highlight];
                if (idx >= 0 && idx < g_total_effects) {
                    ApplySelectedEffect(g_all_effects[idx].matchName);
                }
            }
            DestroyWindow(hwnd);
            return 0;
        }
        if (ch == VK_ESCAPE) {
            DestroyWindow(hwnd);
            return 0;
        }
        if (ch == 8) {
            if (g_search_len > 0) {
                g_search_buffer[--g_search_len] = L'\0';
                g_search_highlight = 0;
                FilterEffects(g_search_buffer, &g_filtered_count, g_filtered_indices, 256);
                InvalidateRect(hwnd, NULL, TRUE);
            }
            return 0;
        }
        if (ch >= 32 && ch < 127 && g_search_len < 63) {
            g_search_buffer[g_search_len++] = ch;
            g_search_buffer[g_search_len] = L'\0';
            g_search_highlight = 0;
            FilterEffects(g_search_buffer, &g_filtered_count, g_filtered_indices, 256);
            InvalidateRect(hwnd, NULL, TRUE);
        }

        KillTimer(hwnd, SEARCH_TIMER_CLOSE);
        SetTimer(hwnd, SEARCH_TIMER_CLOSE, SEARCH_TIMEOUT_MS, NULL);
        return 0;
    }

    case WM_KEYDOWN: {
        if (wParam == VK_UP) {
            if (g_search_highlight > 0) {
                g_search_highlight--;
                InvalidateRect(hwnd, NULL, TRUE);
            }
        } else if (wParam == VK_DOWN) {
            if (g_search_highlight < g_filtered_count - 1) {
                g_search_highlight++;
                InvalidateRect(hwnd, NULL, TRUE);
            }
        } else if (wParam == VK_RETURN) {
            if (g_filtered_count > 0 && g_search_highlight >= 0 && g_search_highlight < g_filtered_count) {
                int idx = g_filtered_indices[g_search_highlight];
                if (idx >= 0 && idx < g_total_effects) {
                    ApplySelectedEffect(g_all_effects[idx].matchName);
                }
            }
            DestroyWindow(hwnd);
        } else if (wParam == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }

        KillTimer(hwnd, SEARCH_TIMER_CLOSE);
        SetTimer(hwnd, SEARCH_TIMER_CLOSE, SEARCH_TIMEOUT_MS, NULL);
        return 0;
    }

    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);

        RECT client;
        GetClientRect(hwnd, &client);
        int w = client.right - client.left;
        int h = client.bottom - client.top;

        HDC memDC = CreateCompatibleDC(hdc);
        BITMAPV5HEADER bi = { 0 };
        bi.bV5Size = sizeof(BITMAPV5HEADER);
        bi.bV5Width = w;
        bi.bV5Height = h;
        bi.bV5Planes = 1;
        bi.bV5BitCount = 32;
        bi.bV5Compression = BI_BITFIELDS;
        bi.bV5RedMask = 0x00FF0000;
        bi.bV5GreenMask = 0x0000FF00;
        bi.bV5BlueMask = 0x000000FF;
        bi.bV5AlphaMask = 0xFF000000;

        void* bits = NULL;
        HBITMAP bmp = CreateDIBSection(memDC, (BITMAPINFO*)&bi, DIB_RGB_COLORS, &bits, NULL, 0);
        HBITMAP oldBmp = (HBITMAP)SelectObject(memDC, bmp);

        memset(bits, 0, w * h * 4);

        RenderSearchPanel(memDC, w, h);

        BLENDFUNCTION blend = { AC_SRC_OVER, 0, 230, AC_SRC_ALPHA };
        POINT srcPos = { 0, 0 };
        SIZE size = { w, h };
        UpdateLayeredWindow(hwnd, hdc, NULL, &size, memDC, &srcPos, 0, &blend, ULW_ALPHA);

        SelectObject(memDC, oldBmp);
        DeleteObject(bmp);
        DeleteDC(memDC);

        EndPaint(hwnd, &ps);
        return 0;
    }

    case WM_ACTIVATE:
        if (wParam == WA_ACTIVE || wParam == WA_CLICKACTIVE) {
            SetFocus(hwnd);
        }
        return 0;

    case WM_DESTROY:
        g_search_hwnd = NULL;
        KillTimer(hwnd, SEARCH_TIMER_CLOSE);
        KillTimer(hwnd, SEARCH_TIMER_INPUT);
        return 0;
    }

    return DefWindowProc(hwnd, msg, wParam, lParam);
}

void RegisterSearchOverlayClass(HINSTANCE hInstance)
{
    g_search_hInst = hInstance;

    WNDCLASSEX wc = { 0 };
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = SearchOverlayProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.lpszClassName = SEARCH_WND_CLASS;
    RegisterClassEx(&wc);
}

void ShowSearchOverlay(HWND parent_hwnd)
{
    if (g_search_hwnd) {
        DestroyWindow(g_search_hwnd);
        g_search_hwnd = NULL;
    }

    g_search_parent = parent_hwnd;

    g_total_effects = GetEffectList(&g_all_effects);

    g_search_len = 0;
    g_search_buffer[0] = L'\0';
    g_search_highlight = 0;
    FilterEffects(L"", &g_filtered_count, g_filtered_indices, 256);

    int w = SEARCH_PANEL_WIDTH;
    int h = SEARCH_PANEL_HEIGHT;

    RECT aeRect;
    GetWindowRect(parent_hwnd, &aeRect);
    int aeW = aeRect.right - aeRect.left;
    int x = aeRect.left + (aeW - w) / 2;
    int y = aeRect.top + 80;

    g_search_hwnd = CreateWindowEx(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOPMOST,
        SEARCH_WND_CLASS,
        "WB Search",
        WS_POPUP,
        x, y, w, h,
        parent_hwnd, NULL, g_search_hInst, NULL);

    if (g_search_hwnd) {
        ShowWindow(g_search_hwnd, SW_SHOW);
        SetForegroundWindow(g_search_hwnd);
        SetFocus(g_search_hwnd);
    }
}

void DestroySearchOverlay()
{
    if (g_search_hwnd) {
        DestroyWindow(g_search_hwnd);
        g_search_hwnd = NULL;
    }
}
