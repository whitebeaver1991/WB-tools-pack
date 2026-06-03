#include <windows.h>
#pragma comment(lib, "user32.lib")

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    MessageBoxA(NULL, "If you see this, the process runs fine.", "WB Test", MB_OK);

    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.lpfnWndProc = DefWindowProcW;
    wc.hInstance = hInst;
    wc.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH);
    wc.lpszClassName = L"VisibleTest";
    RegisterClassExW(&wc);

    HWND hwnd = CreateWindowExW(0, L"VisibleTest", L"CAN YOU SEE THIS?",
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        200, 200, 400, 300, NULL, NULL, hInst, NULL);

    // Flash the window
    FlashWindow(hwnd, TRUE);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg); DispatchMessage(&msg);
    }
    return 0;
}
