#pragma once
#include "AEConfig.h"
#ifdef AE_OS_WIN
    #include <windows.h>
    #include <windowsx.h>
    #include <commctrl.h>
#endif
#include "entry.h"
#include "AE_GeneralPlug.h"
#include "AE_Macros.h"
#include "AEGP_SuiteHandler.h"
#include "String_Utils.h"
#include "WB_PieMenu_Strings.h"
#include <stdio.h>
#include <math.h>
#include <wincodec.h>
#pragma warning(disable: 4819)
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "windowscodecs.lib")
#pragma comment(lib, "msimg32.lib")

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define MAX_PAGES     3
#define MAX_ITEMS     48
#define WIN_SIZE      600
#define CENTER        (WIN_SIZE / 2)
#define SECTOR_OUTER  280
#define DEAD_ZONE_R   30
#define RING_R        36
#define RING_STROKE   8
#define ARC_STROKE    7
#define QUICK_W       240
#define QUICK_H       34
#define QUICK_GAP     4
#define QUICK_FONT    13
#define WHEEL_BAR_W   160
#define WHEEL_BAR_H   42
#define WHEEL_GAP     6
#define WHEEL_ARM     90
#define TIMEOUT_MS    3000

#define WIN_SIZE_BASE  1050
#define CENTER_BASE    525
#define SO_BASE        490
#define DZ_BASE        50
#define RR_BASE        63
#define QW_BASE        420
#define QH_BASE        60
#define WH_BASE        74
#define WA_BASE        158

#define WBEFF_MAGIC   0x46454257
#define WBEFF_FLOAT   1
#define WBEFF_2D      2
#define WBEFF_3D      3
#define WBEFF_COLOR   4
#define WBEFF_DROPDOWN 5
#define WBEFF_BOOL    6

enum MenuType { MENU_PIE = 0, MENU_QUICK = 1, MENU_WHEEL = 2, MENU_INFINITE = 3 };
enum ActionType { ACTION_APPLY_EFFECT = 0, ACTION_SCRIPT = 1, ACTION_URL = 2, ACTION_NOOP = 3 };

struct HitArea { int sector, ring, sub; double a0, a1; int r0, r1; };

extern AEGP_Command   S_pi_cmd[5];
extern AEGP_PluginID  S_id;
extern SPBasicSuite   *sP;
extern HWND           g_hwnd;
extern HWND           g_rawWnd;
extern int            g_hover;
extern bool           g_class_registered[4];

extern int  g_menuType;
extern int  g_itemCount;
extern int  g_pieCount;
extern int  g_quickCount;
extern int  g_curPage;
extern int  g_totalPages;
extern int  g_wheelCount;
extern int  g_scrollAccum;

extern char g_names  [4][MAX_PAGES][MAX_ITEMS][64];
extern char g_effects[4][MAX_PAGES][MAX_ITEMS][256];
extern char g_imgNorm[4][MAX_PAGES][MAX_ITEMS][512];
extern char g_imgHovr[4][MAX_PAGES][MAX_ITEMS][512];
extern int  g_imgSize[4][MAX_PAGES][MAX_ITEMS];
extern int  g_slotKey[4][MAX_PAGES][MAX_ITEMS];
extern int  g_slotMod[4][MAX_PAGES][MAX_ITEMS];
extern int  g_slotAction[4][MAX_PAGES][MAX_ITEMS];

extern int    g_infiniteSectors;
extern int    g_infiniteSplitR2;
extern int    g_infiniteSplitR3;
extern int    g_infiniteRDead;
extern int    g_infiniteR1;
extern int    g_infiniteR2;
extern COLORREF g_infiniteSectorColors[8];
extern int    g_infiniteHoverSlot;
extern int    g_infiniteHoverSector;

extern HitArea g_hitAreas[48];
extern int    g_hitAreaCount;

extern int   g_triggerKey;
extern int   g_triggerMod;
extern int   g_settingsVersion;
extern int   g_prevPageKey;
extern int   g_nextPageKey;
extern int   g_winAlpha;
extern int   g_selectMode;
extern int   g_bgAlpha[4];
extern int   g_bgColor[4];
extern int   g_glowColor[4];
extern int   g_pageColor[4];
extern int   g_glowIntensity[4];
extern int   g_imgDist[4];
extern int   g_textDist[4];
extern int   g_menuScale[4];
extern int   g_textSize[4];
extern bool  g_numpadEnabled;
extern bool  g_guideEnabled;
extern int   g_guideColor;
extern int   g_guideWidth;
extern HANDLE g_numpadHandle;
extern char  g_numpadName[128];

extern COLORREF g_palette[MAX_ITEMS];
extern HBRUSH   g_brushes[MAX_ITEMS];
extern HBITMAP  g_bitmaps[4][MAX_PAGES][MAX_ITEMS][2];
extern double   g_sectorStart[MAX_ITEMS], g_sectorEnd[MAX_ITEMS], g_sectorCenter[MAX_ITEMS];
extern bool     g_layoutInit;
extern double   g_arcAngleDeg;
extern int      g_pendingItem;
extern int      g_mouseX, g_mouseY;
extern double   g_cursorAngle;
extern UINT_PTR g_timerId;

extern const UINT_PTR TIMEOUT_TID;
extern const UINT_PTR HOLD_TID;

extern char  g_saveEffPath[MAX_PATH];
extern char  g_applyEffPath[MAX_PATH];
extern bool  g_saveEffPending;
extern bool  g_applyEffPending;
extern char  g_effResult[64];
extern char  g_svPath[MAX_PATH];
extern bool  g_dumpEffectsPending;

void GetSettingsPath(char *buf, int sz);
void DefaultsForMenu(int m);
void SetVal(const char *key, const char *val);
void LoadSettings(void);
void WriteSection(FILE *f, const char *prefix, int pages, int count);
void WriteInfiniteSection(FILE *f);
void RegisterTriggerHotkey(void);
void ClearPendingInFile(void);

void WriteEffResult(const char *r);
bool SaveWBEFF(const char *wp, AEGP_LayerH lh);
bool ApplyWBEFF(const char *wp, AEGP_LayerH lh);
void DoSaveEff(void);
void DoApplyEff(void);

void InitLayout(void);
void InitBrushes(void);
void FreeBrushes(void);
void ClearBitmaps(void);
void CancelTimer(void);
void ResetTimer(void);
void HideMenu(void);
void GotoPage(int p);
void SelectItem(int idx);
void ShowMenu(void);
void LoadBitmaps(void);
void ApplyEffect(const char *matchName);
void ApplyPending(void);
void DumpEffectNames(void);

HBITMAP CreateGlowFromAlpha(HBITMAP src, COLORREF color, int intensity);
HBITMAP CreateBlackAlpha(HBITMAP src);
HBITMAP LoadImageFile(const char *path);
void DrawImageSector(HDC dc, int idx);
int HitTestSector(int mx, int my);
int HitTestSectorExtended(int mx, int my);
void InitRawWindow(void);
LRESULT CALLBACK RawWndProc(HWND hwnd, UINT msg, WPARAM w, LPARAM l);

void DrawPie(HDC hdc);

void DrawQuick(HDC hdc);
int HitTestQuick(int mx, int my);

void DrawWheel(HDC hdc);
int HitTestWheel(int mx, int my);

void DrawInfinite(HDC hdc);
int HitTestInfinite(int mx, int my);
void DrawRingSector(HDC dc, int cx, int cy, int rInner, int rOuter, double a0, double a1, COLORREF fill);
COLORREF AdjustSectorColor(COLORREF base, double sMul, double lMul);
void HSLtoRGB(double h, double s, double l, int &r, int &g, int &b);

void DrawGuideLine(HDC dc, int cx, int cy);

A_Err UpdateMenuHook(AEGP_GlobalRefcon, AEGP_UpdateMenuRefcon, AEGP_WindowType);
A_Err CommandHook(AEGP_GlobalRefcon, AEGP_CommandRefcon, AEGP_Command cmd, AEGP_HookPriority, A_Boolean, A_Boolean *handledPB);
A_Err IdleHook(AEGP_GlobalRefcon, AEGP_IdleRefcon, A_long*);
extern "C" DllExport AEGP_PluginInitFuncPrototype EntryPointFunc;
