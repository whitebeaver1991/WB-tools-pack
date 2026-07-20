#include "..\WB_PieMenu.h"

AEGP_Command   S_pi_cmd[8] = {0};
AEGP_PluginID  S_id        = 0L;
SPBasicSuite   *sP         = NULL;
HWND           g_hwnd      = NULL;
HWND           g_rawWnd    = NULL;
int            g_hover     = -1;
bool           g_class_registered[4] = {false};

int  g_menuType   = MENU_PIE;
int  g_itemCount  = 4;
int  g_pieCount   = 4;
int   g_quickCount = 6;
int   g_quickStyle = 0;
int   g_curPage    = 0;
int  g_totalPages = 3;
int  g_wheelCount = 8;
int  g_scrollAccum = 0;

char g_names  [4][MAX_PAGES][MAX_ITEMS][64];
char g_effects[4][MAX_PAGES][MAX_ITEMS][256];
char g_imgNorm[4][MAX_PAGES][MAX_ITEMS][512];
char g_imgHovr[4][MAX_PAGES][MAX_ITEMS][512];
int  g_imgSize[4][MAX_PAGES][MAX_ITEMS];
int  g_slotKey[4][MAX_PAGES][MAX_ITEMS];
int  g_slotMod[4][MAX_PAGES][MAX_ITEMS];
int  g_slotAction[4][MAX_PAGES][MAX_ITEMS];

int    g_infiniteSectors = 8;
int    g_infiniteSplitR2 = 0;
int    g_infiniteSplitR3 = 3;
int    g_infiniteRDead = 20;
int    g_infiniteR1 = 80;
int    g_infiniteR2 = 140;
COLORREF g_infiniteSectorColors[8] = {
    RGB(0x3a,0x6a,0x3a), RGB(0x6a,0x5a,0x3a), RGB(0x3a,0x5a,0x7a), RGB(0x6a,0x3a,0x5a),
    RGB(0x5a,0x5a,0x3a), RGB(0x3a,0x6a,0x5a), RGB(0x5a,0x3a,0x6a), RGB(0x6a,0x4a,0x3a)
};
int    g_infiniteHoverSlot = -1;
int    g_infiniteHoverSector = -1;

HitArea g_hitAreas[48];
int    g_hitAreaCount = 0;

int   g_triggerKey = 32, g_triggerMod = 6;
int   g_settingsVersion = 0;
int   g_prevPageKey = 90, g_nextPageKey = 88;
int   g_winAlpha = 60;
int   g_selectMode = 0;
int   g_bgAlpha[4] = {60,60,60,60};
int   g_bgColor[4] = {0x2A2A2A,0x2A2A2A,0x2A2A2A,0x2A2A2A};
int   g_bgScale[4] = {100,100,100,100};
int   g_bgOffsetX[4] = {0,0,0,0};
int   g_bgOffsetY[4] = {0,0,0,0};
COLORREF g_slotBgColor[4][8] = {
    {RGB(220,80,80),RGB(70,200,70),RGB(60,120,230),RGB(230,190,50),RGB(180,60,180),RGB(60,200,200),RGB(240,140,40),RGB(90,90,95)},
    {RGB(220,80,80),RGB(70,200,70),RGB(60,120,230),RGB(230,190,50),RGB(180,60,180),RGB(60,200,200),RGB(240,140,40),RGB(90,90,95)},
    {RGB(220,80,80),RGB(70,200,70),RGB(60,120,230),RGB(230,190,50),RGB(180,60,180),RGB(60,200,200),RGB(240,140,40),RGB(90,90,95)},
    {RGB(40,40,45),RGB(40,40,45),RGB(40,40,45),RGB(40,40,45),RGB(40,40,45),RGB(40,40,45),RGB(40,40,45),RGB(40,40,45)}
};
int   g_glowColor[4] = {0x3CB93C,0x3CB93C,0x3CB93C,0x3CB93C};
int   g_pageColor[4] = {0x78787D,0x78787D,0x78787D,0x78787D};
int   g_glowIntensity[4] = {100,100,100,100};
int   g_imgDist[4] = {45,45,45,45};
int   g_textDist[4] = {85,85,85,85};
int   g_menuScale[4] = {100,100,100,100};
int   g_textSize[4] = {100,100,100,100};
bool  g_numpadEnabled = true;
int   g_numpadEnterAction = 1; // 1=Quick Menu by default
bool  g_numpadTriggered = false;
bool  g_guideEnabled = false;
int   g_guideColor = 0xC0C0C0;
int   g_guideWidth = 2;
HANDLE g_numpadHandle = NULL;
char  g_numpadName[128] = {0};
char  g_numpadDevicePath[512] = {0};
bool  g_numpadPairing = false;

COLORREF g_palette[MAX_ITEMS] = {
    RGB(220,80,80), RGB(70,200,70), RGB(60,120,230), RGB(230,190,50),
    RGB(180,60,180), RGB(60,200,200), RGB(240,140,40), RGB(160,160,160), RGB(200,200,200)
};
HBRUSH   g_brushes[MAX_ITEMS] = {0};
HBITMAP  g_bitmaps[4][MAX_PAGES][MAX_ITEMS][2] = {{{{0}}}};
char     g_bgPath[4][MAX_PATH] = {{0}};
HBITMAP  g_bgBitmap[4] = {0};
double   g_sectorStart[MAX_ITEMS], g_sectorEnd[MAX_ITEMS], g_sectorCenter[MAX_ITEMS];
bool     g_layoutInit = false;
double   g_arcAngleDeg = -90.0;
int      g_pendingItem = -1;
int      g_mouseX = 0, g_mouseY = 0;
double   g_cursorAngle = -90.0;
UINT_PTR g_timerId = 0;

const UINT_PTR TIMEOUT_TID = 101;
const UINT_PTR HOLD_TID   = 102;

char  g_saveEffPath[MAX_PATH] = {0};
char  g_applyEffPath[MAX_PATH] = {0};
bool  g_saveEffPending = false;
bool  g_applyEffPending = false;
char  g_effResult[64] = {0};
char  g_svPath[MAX_PATH] = {0};
bool  g_dumpEffectsPending = false;

void WriteEffResult(const char *r)
{
    strncpy_s(g_effResult, sizeof(g_effResult), r, _TRUNCATE);
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "a");
    if (f) { fprintf(f, "save_eff_result=%s\n", r); fclose(f); }
}

void SavePairingToFile(void)
{
    if (!g_numpadDevicePath[0]) return;
    char p[MAX_PATH];
    GetSettingsPath(p, sizeof(p));
    p[strlen(p) - 12] = 0; // remove "settings.txt"
    _snprintf_s(p, MAX_PATH, _TRUNCATE, "%s\\numpad_pairing.cfg", p);
    FILE *f = NULL; fopen_s(&f, p, "w");
    if (f) {
        fprintf(f, "numpad_device_path=%s\n", g_numpadDevicePath);
        fclose(f);
    }
}

void LoadNumpadPairing(void)
{
    g_numpadDevicePath[0] = 0;
    g_numpadPairing = false;
    char p[MAX_PATH];
    GetSettingsPath(p, sizeof(p));
    p[strlen(p) - 12] = 0;
    _snprintf_s(p, MAX_PATH, _TRUNCATE, "%s\\numpad_pairing.cfg", p);
    FILE *f = NULL; fopen_s(&f, p, "r");
    if (f) {
        char buf[1024];
        while (fgets(buf, sizeof(buf), f)) {
            char k[64] = {0}, v[960] = {0};
            if (sscanf_s(buf, " %63[^=]=%959[^\r\n]", k, 64, v, 960) >= 1) {
                if (strcmp(k, "numpad_device_path") == 0 && v[0])
                    strncpy_s(g_numpadDevicePath, sizeof(g_numpadDevicePath), v, _TRUNCATE);
                else if (strcmp(k, "numpad_pairing") == 0 && atoi(v) != 0)
                    g_numpadPairing = true;
            }
        }
        fclose(f);
    }
}

bool SaveWBEFF(const char *wp, AEGP_LayerH lh)
{
    AEGP_SuiteHandler s(sP); A_Err e = A_Err_NONE;
    FILE *f = NULL; fopen_s(&f, wp, "wb"); if (!f) return false;
    A_long ne = 0;
    e = s.EffectSuite4()->AEGP_GetLayerNumEffects(lh, &ne);
    uint32_t h[3] = { WBEFF_MAGIC, 1, (e || ne <= 0) ? 0 : (uint32_t)ne }; fwrite(h, 12, 1, f);
    for (A_long ei = 1; ei <= ne; ei++) {
        AEGP_EffectRefH eh = NULL;
        e = s.EffectSuite4()->AEGP_GetLayerEffectByIndex(S_id, lh, ei, &eh);
        if (e || !eh) { uint32_t z = 0; fwrite(&z, 4, 1, f); fwrite(&z, 4, 1, f); continue; }
        AEGP_InstalledEffectKey ik = 0;
        s.EffectSuite4()->AEGP_GetInstalledKeyFromLayerEffect(eh, &ik);
        A_char mn[512] = {0}; s.EffectSuite4()->AEGP_GetEffectMatchName(ik, mn);
        uint32_t ml = (uint32_t)strlen(mn) + 1; fwrite(&ml, 4, 1, f); fwrite(mn, 1, ml, f);
        A_long np = 0; e = s.StreamSuite6()->AEGP_GetEffectNumParamStreams(eh, &np);
        if (e) np = 0;
        uint32_t npa = (np > 0) ? (uint32_t)(np - 1) : 0; fwrite(&npa, 4, 1, f);
        for (A_long pi = 1; pi < np; pi++) {
            AEGP_StreamRefH sh = NULL;
            e = s.StreamSuite6()->AEGP_GetNewEffectStreamByIndex(S_id, eh, pi, &sh);
            if (e || !sh) { uint32_t z = 0; fwrite(&z, 4, 1, f); fwrite(&z, 4, 1, f); continue; }
            AEGP_StreamType st; e = s.StreamSuite6()->AEGP_GetStreamType(sh, &st);
            AEGP_MemHandle nh = NULL; A_UTF16Char *n16 = NULL;
            s.StreamSuite6()->AEGP_GetStreamName(S_id, sh, TRUE, &nh);
            if (nh) s.MemorySuite1()->AEGP_LockMemHandle(nh, (void**)&n16);
            char nb[256] = {0};
            if (n16) for (size_t ni = 0; ni < 255 && n16[ni]; ni++) nb[ni] = (char)n16[ni];
            uint32_t nl = (uint32_t)strlen(nb) + 1; fwrite(&nl, 4, 1, f); fwrite(nb, 1, nl, f);
            if (nh) { if (n16) s.MemorySuite1()->AEGP_UnlockMemHandle(nh); s.MemorySuite1()->AEGP_FreeMemHandle(nh); }
            A_Time ct; ct.scale = 1000000; ct.value = 0;
            AEGP_StreamValue2 sv; memset(&sv, 0, sizeof(sv));
            e = s.StreamSuite6()->AEGP_GetNewStreamValue(S_id, sh, AEGP_LTimeMode_CompTime, &ct, FALSE, &sv);
            if (!e) {
                uint32_t tt = WBEFF_FLOAT;
                if (st == AEGP_StreamType_OneD) tt = WBEFF_FLOAT;
                else if (st == AEGP_StreamType_TwoD || st == AEGP_StreamType_TwoD_SPATIAL) tt = WBEFF_2D;
                else if (st == AEGP_StreamType_ThreeD || st == AEGP_StreamType_ThreeD_SPATIAL) tt = WBEFF_3D;
                else if (st == AEGP_StreamType_COLOR) tt = WBEFF_COLOR;
                fwrite(&tt, 4, 1, f);
                switch (tt) {
                    case WBEFF_FLOAT: { double v = sv.val.one_d; fwrite(&v, 8, 1, f); break; }
                    case WBEFF_2D: { fwrite(&sv.val.two_d, 16, 1, f); break; }
                    case WBEFF_3D: { fwrite(&sv.val.three_d, 24, 1, f); break; }
                    case WBEFF_COLOR: { fwrite(&sv.val.color, 16, 1, f); break; }
                    case WBEFF_DROPDOWN: { double v = sv.val.one_d; int32_t d = (int32_t)v; fwrite(&d, 4, 1, f); break; }
                    case WBEFF_BOOL: { double v = sv.val.one_d; uint32_t b = (v != 0) ? 1 : 0; fwrite(&b, 4, 1, f); break; }
                    default: { double v = sv.val.one_d; fwrite(&v, 8, 1, f); break; }
                }
                s.StreamSuite6()->AEGP_DisposeStreamValue(&sv);
            } else { uint32_t z = 0; fwrite(&z, 4, 1, f); }
            s.StreamSuite6()->AEGP_DisposeStream(sh);
        }
        s.EffectSuite4()->AEGP_DisposeEffect(eh);
    }
    fclose(f); return true;
}

bool ApplyWBEFF(const char *wp, AEGP_LayerH lh)
{
    AEGP_SuiteHandler s(sP); A_Err e;
    FILE *f = NULL; fopen_s(&f, wp, "rb"); if (!f) return false;
    uint32_t h[3]; if (fread(h, 12, 1, f) != 1 || h[0] != WBEFF_MAGIC || h[1] != 1) { fclose(f); return false; }
    for (uint32_t ei = 0; ei < h[2]; ei++) {
        uint32_t ml = 0; if (fread(&ml, 4, 1, f) != 1) break;
        char *mn = (char*)malloc(ml + 4); if (!mn) break;
        memset(mn, 0, ml + 4); if (fread(mn, 1, ml, f) != ml) { free(mn); break; }
        uint32_t np = 0; if (fread(&np, 4, 1, f) != 1) { free(mn); break; }
        A_long ti = 0; AEGP_InstalledEffectKey ik = 0; A_Boolean fd = FALSE;
        s.EffectSuite4()->AEGP_GetNumInstalledEffects(&ti);
        for (A_long i = 0; i < ti && !fd; i++) {
            AEGP_InstalledEffectKey nk = 0; s.EffectSuite4()->AEGP_GetNextInstalledEffect(ik, &nk);
            if (!nk) break; ik = nk; A_char nz[512] = {0};
            s.EffectSuite4()->AEGP_GetEffectMatchName(ik, nz);
            if (strcmp(nz, mn) == 0) fd = TRUE;
        }
        if (fd) {
            AEGP_EffectRefH neh = NULL;
            e = s.EffectSuite4()->AEGP_ApplyEffect(S_id, lh, ik, &neh);
            if (!e && neh) {
                A_long nnp = 0; s.StreamSuite6()->AEGP_GetEffectNumParamStreams(neh, &nnp);
                uint32_t mr = (np < (uint32_t)(nnp - 1)) ? np : (uint32_t)(nnp - 1);
                for (uint32_t pi = 0; pi < mr; pi++) {
                    AEGP_StreamRefH sh = NULL;
                    e = s.StreamSuite6()->AEGP_GetNewEffectStreamByIndex(S_id, neh, (A_long)(pi + 1), &sh);
                    if (e || !sh) {
                        uint32_t z; fread(&z, 4, 1, f); fseek(f, z, SEEK_CUR);
                        fread(&z, 4, 1, f);
                        switch (z) {
                            case 1: fseek(f, 8, SEEK_CUR); break; case 2: fseek(f, 16, SEEK_CUR); break;
                            case 3: fseek(f, 24, SEEK_CUR); break; case 4: fseek(f, 16, SEEK_CUR); break;
                            case 5: case 6: fseek(f, 4, SEEK_CUR); break;
                            default: fseek(f, 8, SEEK_CUR); break;
                        } continue;
                    }
                    uint32_t nl; fread(&nl, 4, 1, f); fseek(f, nl, SEEK_CUR);
                    uint32_t tt; fread(&tt, 4, 1, f);
                    AEGP_StreamType tst; s.StreamSuite6()->AEGP_GetStreamType(sh, &tst);
                    AEGP_StreamValue2 sv; memset(&sv, 0, sizeof(sv));
                    switch (tt) {
                        case WBEFF_FLOAT: { double v; fread(&v, 8, 1, f); sv.val.one_d = v; break; }
                        case WBEFF_2D: fread(&sv.val.two_d, 16, 1, f); break;
                        case WBEFF_3D: fread(&sv.val.three_d, 24, 1, f); break;
                        case WBEFF_COLOR: fread(&sv.val.color, 16, 1, f); break;
                        case WBEFF_DROPDOWN: { int32_t d; fread(&d, 4, 1, f); sv.val.one_d = (double)d; break; }
                        case WBEFF_BOOL: { uint32_t b; fread(&b, 4, 1, f); sv.val.one_d = b ? 1.0 : 0.0; break; }
                        default: { double v; fread(&v, 8, 1, f); sv.val.one_d = v; break; }
                    }
                    A_Err setErr = s.StreamSuite6()->AEGP_SetStreamValue(S_id, sh, &sv);
                    (void)setErr;
                    s.StreamSuite6()->AEGP_DisposeStream(sh);
                }
                AEGP_EffectFlags ef;
                if (!s.EffectSuite4()->AEGP_GetEffectFlags(neh, &ef)) {
                    s.EffectSuite4()->AEGP_SetEffectFlags(neh, AEGP_EffectFlags_ACTIVE, ef & ~AEGP_EffectFlags_ACTIVE);
                    s.EffectSuite4()->AEGP_SetEffectFlags(neh, AEGP_EffectFlags_ACTIVE, ef);
                }
                s.EffectSuite4()->AEGP_DisposeEffect(neh);
            } else {
                for (uint32_t pi = 0; pi < np; pi++) {
                    uint32_t z; fread(&z, 4, 1, f); fseek(f, z, SEEK_CUR);
                    fread(&z, 4, 1, f);
                    switch (z) { case 1: fseek(f, 8, SEEK_CUR); break; case 2: fseek(f, 16, SEEK_CUR); break; case 3: fseek(f, 24, SEEK_CUR); break; case 4: fseek(f, 16, SEEK_CUR); break; case 5: case 6: fseek(f, 4, SEEK_CUR); break; default: fseek(f, 8, SEEK_CUR); break; }
                }
            }
        } else {
            for (uint32_t pi = 0; pi < np; pi++) {
                uint32_t z; fread(&z, 4, 1, f); fseek(f, z, SEEK_CUR);
                fread(&z, 4, 1, f);
                switch (z) { case 1: fseek(f, 8, SEEK_CUR); break; case 2: fseek(f, 16, SEEK_CUR); break; case 3: fseek(f, 24, SEEK_CUR); break; case 4: fseek(f, 16, SEEK_CUR); break; case 5: case 6: fseek(f, 4, SEEK_CUR); break; default: fseek(f, 8, SEEK_CUR); break; }
            }
        }
        free(mn);
    }
    fclose(f); return true;
}

void DoSaveEff(void)
{
    AEGP_SuiteHandler s(sP);
    LoadSettings();
    if (!g_saveEffPath[0]) { WriteEffResult("CANCEL"); return; }

    AEGP_ItemH ih = NULL; A_Err e = s.ItemSuite6()->AEGP_GetActiveItem(&ih);
    if (e || !ih) { WriteEffResult("ERR:No comp"); return; }
    AEGP_CompH ch = NULL; e = s.CompSuite4()->AEGP_GetCompFromItem(ih, &ch);
    if (e || !ch) { WriteEffResult("ERR:No comp"); return; }
    AEGP_LayerH lh = NULL; e = s.LayerSuite9()->AEGP_GetActiveLayer(&lh);
    if (e || !lh) { WriteEffResult("ERR:No layer"); return; }

    bool ok = SaveWBEFF(g_saveEffPath, lh);
    WriteEffResult(ok ? g_saveEffPath : "ERR:Save failed");
    g_saveEffPath[0] = 0; g_saveEffPending = false;
}

void DoApplyEff(void)
{
    AEGP_SuiteHandler s(sP);
    AEGP_ItemH ih = NULL; A_Err e = s.ItemSuite6()->AEGP_GetActiveItem(&ih);
    if (e || !ih) { WriteEffResult("ERR:No comp"); return; }
    AEGP_CompH ch = NULL; e = s.CompSuite4()->AEGP_GetCompFromItem(ih, &ch);
    if (e || !ch) { WriteEffResult("ERR:No comp"); return; }
    AEGP_LayerH lh = NULL; e = s.LayerSuite9()->AEGP_GetActiveLayer(&lh);
    if (e || !lh) { WriteEffResult("ERR:No layer"); return; }

    LoadSettings();
    if (g_applyEffPath[0] && g_applyEffPending) {
        bool ok = ApplyWBEFF(g_applyEffPath, lh);
        g_applyEffPath[0] = 0; g_applyEffPending = false;
        WriteEffResult(ok ? "OK" : "ERR:Apply failed");
    } else {
        WriteEffResult("CANCEL");
    }
}

void InitLayout(void)
{
    g_hover = -1; g_layoutInit = true;
    double step = 2.0 * M_PI / g_itemCount;
    for (int i = 0; i < g_itemCount; i++) {
        g_sectorCenter[i] = i * step - M_PI / 2.0;
        g_sectorStart[i] = g_sectorCenter[i] - step / 2.0;
        g_sectorEnd[i]   = g_sectorCenter[i] + step / 2.0;
    }
}

void InitBrushes(void)
{
    FreeBrushes();
    for (int i = 0; i < g_itemCount; i++)
        g_brushes[i] = CreateSolidBrush(g_palette[i]);
}

void FreeBrushes(void)
{
    for (int i = 0; i < MAX_ITEMS; i++)
        if (g_brushes[i]) { DeleteObject(g_brushes[i]); g_brushes[i] = NULL; }
}

void ClearBitmaps(void)
{
    for (int m = 0; m < 4; m++)
        for (int p = 0; p < MAX_PAGES; p++)
            for (int i = 0; i < MAX_ITEMS; i++)
                for (int j = 0; j < 2; j++)
                    if (g_bitmaps[m][p][i][j]) { DeleteObject(g_bitmaps[m][p][i][j]); g_bitmaps[m][p][i][j] = NULL; }
    for (int m = 0; m < 4; m++)
        if (g_bgBitmap[m]) { DeleteObject(g_bgBitmap[m]); g_bgBitmap[m] = NULL; }
}

void CancelTimer(void)
{
    if (g_timerId && g_hwnd) { KillTimer(g_hwnd, TIMEOUT_TID); g_timerId = 0; }
}

void ResetTimer(void)
{
    CancelTimer();
    if (g_hwnd) { g_timerId = (UINT_PTR)SetTimer(g_hwnd, TIMEOUT_TID, TIMEOUT_MS, NULL); }
}

void HideMenu(void)
{
    CancelTimer();
    HWND h = g_hwnd; g_hwnd = NULL; g_hover = -1;
    if (h) { ReleaseCapture(); DestroyWindow(h); }
}

void GotoPage(int p)
{
    if (p < 0 || p >= g_totalPages || p == g_curPage) return;
    g_curPage = p;
    g_hover = -1; g_layoutInit = false;
    InvalidateRect(g_hwnd, NULL, TRUE);
    if (g_menuType != MENU_INFINITE) ResetTimer();
}

void SelectItem(int idx)
{
    if (idx < 0 || idx >= g_itemCount) return;
    g_pendingItem = idx;
    HideMenu();
}

void LoadBitmaps(void)
{
    ClearBitmaps();
    for (int p = 0; p < MAX_PAGES; p++)
        for (int i = 0; i < g_itemCount; i++) {
            if (g_imgNorm[g_menuType][p][i][0])
                g_bitmaps[g_menuType][p][i][0] = LoadImageFile(g_imgNorm[g_menuType][p][i]);
        }
    if (g_bgPath[g_menuType][0])
        g_bgBitmap[g_menuType] = LoadImageFile(g_bgPath[g_menuType]);
}

void DrawBackgroundWithTransform(HDC dc, int winSize)
{
    if (!g_bgBitmap[g_menuType]) return;
    BITMAP bm; GetObject(g_bgBitmap[g_menuType], sizeof(bm), &bm);
    HDC bgDc = CreateCompatibleDC(dc);
    HBITMAP bgOb = (HBITMAP)SelectObject(bgDc, g_bgBitmap[g_menuType]);
    SetStretchBltMode(dc, HALFTONE);
    int sc = g_bgScale[g_menuType];
    int dstW = winSize * sc / 100, dstH = winSize * sc / 100;
    int ox = g_bgOffsetX[g_menuType] * winSize / 1050;
    int oy = g_bgOffsetY[g_menuType] * winSize / 1050;
    int srcX = (dstW > bm.bmWidth) ? 0 : (bm.bmWidth - dstW) / 2;
    int srcY = (dstH > bm.bmHeight) ? 0 : (bm.bmHeight - dstH) / 2;
    int srcW = (dstW > bm.bmWidth) ? bm.bmWidth : dstW;
    int srcH = (dstH > bm.bmHeight) ? bm.bmHeight : dstH;
    int dstX = (winSize - dstW) / 2 + ox;
    int dstY = (winSize - dstH) / 2 + oy;
    StretchBlt(dc, dstX, dstY, dstW, dstH, bgDc, 0, 0, bm.bmWidth, bm.bmHeight, SRCCOPY);
    SelectObject(bgDc, bgOb); DeleteDC(bgDc);
}

void ApplyEffect(const char *matchName)
{
    if (!matchName || !matchName[0]) return;
    AEGP_SuiteHandler suites(sP);
    AEGP_ItemH itemH = NULL;
    A_Err err = suites.ItemSuite6()->AEGP_GetActiveItem(&itemH);
    if (err || !itemH) return;
    AEGP_ItemType type; err = suites.ItemSuite6()->AEGP_GetItemType(itemH, &type);
    if (err || type != AEGP_ItemType_COMP) return;
    AEGP_CompH compH = NULL; err = suites.CompSuite4()->AEGP_GetCompFromItem(itemH, &compH);
    if (err || !compH) return;
    A_long numL = 0; err = suites.LayerSuite9()->AEGP_GetCompNumLayers(compH, &numL);
    if (err || numL <= 0) return;
    AEGP_LayerH layerH = NULL; err = suites.LayerSuite9()->AEGP_GetActiveLayer(&layerH);
    if (err || !layerH) return;
    A_long count = 0; err = suites.EffectSuite4()->AEGP_GetNumInstalledEffects(&count);
    if (err || count <= 0) return;
    AEGP_InstalledEffectKey key = 0; A_Boolean found = FALSE;
    for (A_long i = 0; i < count && !found; i++) {
        AEGP_InstalledEffectKey next = 0; err = suites.EffectSuite4()->AEGP_GetNextInstalledEffect(key, &next);
        if (err || !next) break; key = next;
        A_char nZ[512] = {0}; err = suites.EffectSuite4()->AEGP_GetEffectMatchName(key, nZ);
        if (err) continue;
        if (strcmp(nZ, matchName) == 0) found = TRUE;
    }
    if (found) {
        AEGP_EffectRefH ref = NULL; err = suites.EffectSuite4()->AEGP_ApplyEffect(S_id, layerH, key, &ref);
        if (!err && ref) suites.EffectSuite4()->AEGP_DisposeEffect(ref);
    }
}

void ApplyPending(void)
{
    if (g_pendingItem < 0) return;
    int idx = g_pendingItem; g_pendingItem = -1;
    if (idx < g_itemCount && g_effects[g_menuType][g_curPage][idx][0])
        ApplyEffect(g_effects[g_menuType][g_curPage][idx]);
}

void DumpEffectNames(void)
{
    char mapPath[MAX_PATH];
    {
        char a[MAX_PATH]; GetEnvironmentVariableA("LOCALAPPDATA", a, sizeof(a));
        _snprintf_s(mapPath, sizeof(mapPath), _TRUNCATE, "%s\\WB_PieMenu\\effects_map.txt", a);
    }

    FILE *f = NULL; fopen_s(&f, mapPath, "wb");
    if (!f) return;
    const unsigned char bom[] = {0xEF, 0xBB, 0xBF};
    fwrite(bom, 1, 3, f);

    AEGP_SuiteHandler s(sP);
    AEGP_InstalledEffectKey ik = 0;
    A_Err e = s.EffectSuite4()->AEGP_GetNextInstalledEffect(0, &ik);
    while (!e && ik) {
        char display[AEGP_MAX_EFFECT_NAME_SIZE] = {0};
        char match[AEGP_MAX_EFFECT_MATCH_NAME_SIZE] = {0};
        s.EffectSuite4()->AEGP_GetEffectName(ik, display);
        s.EffectSuite4()->AEGP_GetEffectMatchName(ik, match);
        if (match[0]) {
            if (display[0]) {
                int wlen = MultiByteToWideChar(CP_ACP, 0, display, -1, NULL, 0);
                if (wlen > 0) {
                    wchar_t *w = (wchar_t*)malloc(wlen * sizeof(wchar_t));
                    MultiByteToWideChar(CP_ACP, 0, display, -1, w, wlen);
                    int ulen = WideCharToMultiByte(CP_UTF8, 0, w, -1, NULL, 0, NULL, NULL);
                    if (ulen > 0) {
                        char *u = (char*)malloc(ulen);
                        WideCharToMultiByte(CP_UTF8, 0, w, -1, u, ulen, NULL, NULL);
                        fputs(u, f);
                        free(u);
                    }
                    free(w);
                }
            }
            fputc('|', f);
            fputs(match, f);
            fputc('\n', f);
        }
        AEGP_InstalledEffectKey nextIk = 0;
        e = s.EffectSuite4()->AEGP_GetNextInstalledEffect(ik, &nextIk);
        ik = nextIk;
    }
    fclose(f);
    g_dumpEffectsPending = false;
}

HBITMAP CreateGlowFromAlpha(HBITMAP src, COLORREF color, int intensity)
{
    BITMAP bm; GetObject(src, sizeof(bm), &bm);
    if (bm.bmBitsPixel != 32) return NULL;

    int blurRadius = (intensity * 8 + 50) / 100;
    if (blurRadius < 1) blurRadius = 1;
    int pad = blurRadius * 2;
    UINT gw = (UINT)(bm.bmWidth + pad), gh = (UINT)(bm.bmHeight + pad);

    BITMAPINFO bmi;
    ZeroMemory(&bmi, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = gw;
    bmi.bmiHeader.biHeight = -(int)gh;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;

    void *dstBits = NULL;
    HDC dc = GetDC(NULL);
    HBITMAP dst = CreateDIBSection(dc, &bmi, DIB_RGB_COLORS, &dstBits, NULL, 0);
    ReleaseDC(NULL, dc);
    if (!dst || !dstBits) { if (dst) DeleteObject(dst); return NULL; }

    BYTE *srcPx = (BYTE*)bm.bmBits;
    BYTE *dstPx = (BYTE*)dstBits;
    UINT sw = bm.bmWidth, sh = bm.bmHeight;
    UINT dStride = gw * 4, sStride = sw * 4;
    BYTE r = GetRValue(color), g = GetGValue(color), b = GetBValue(color);

    BYTE *tmp = (BYTE*)malloc(gw * gh);
    if (!tmp) { DeleteObject(dst); return NULL; }
    memset(tmp, 0, gw * gh);
    for (UINT yp = 0; yp < sh; yp++)
        for (UINT xp = 0; xp < sw; xp++)
            tmp[(yp + blurRadius) * gw + (xp + blurRadius)] = srcPx[yp * sStride + xp * 4 + 3];

    BYTE *buf = (BYTE*)malloc(gw * gh);
    if (!buf) { free(tmp); DeleteObject(dst); return NULL; }
    for (int pass = 0; pass < 2; pass++) {
        for (UINT yp = 0; yp < gh; yp++) {
            int sum = 0;
            for (int xp = -blurRadius; xp <= blurRadius; xp++) {
                int cx = xp < 0 ? 0 : (xp >= (int)gw ? (int)gw-1 : xp);
                sum += tmp[yp * gw + cx];
            }
            for (UINT xp = 0; xp < gw; xp++) {
                buf[yp * gw + xp] = (BYTE)(sum / (blurRadius * 2 + 1));
                int outX = xp - blurRadius;
                int inX = xp + blurRadius + 1;
                if (outX >= 0) sum -= tmp[yp * gw + outX];
                if (inX < (int)gw) sum += tmp[yp * gw + inX];
            }
        }
        for (UINT xp = 0; xp < gw; xp++) {
            int sum = 0;
            for (int yp = -blurRadius; yp <= blurRadius; yp++) {
                int cy = yp < 0 ? 0 : (yp >= (int)gh ? (int)gh-1 : yp);
                sum += buf[cy * gw + xp];
            }
            for (UINT yp = 0; yp < gh; yp++) {
                tmp[yp * gw + xp] = (BYTE)(sum / (blurRadius * 2 + 1));
                int outY = yp - blurRadius;
                int inY = yp + blurRadius + 1;
                if (outY >= 0) sum -= buf[outY * gw + xp];
                if (inY < (int)gh) sum += buf[inY * gw + xp];
            }
        }
    }

    int lumScale = (intensity * 192 + 50) / 100;
    if (lumScale > 255) lumScale = 255;
    for (UINT yp = 0; yp < gh; yp++) {
        for (UINT xp = 0; xp < gw; xp++) {
            UINT off = yp * dStride + xp * 4;
            BYTE a = (BYTE)((UINT)tmp[yp * gw + xp] * lumScale / 255);
            dstPx[off + 0] = (BYTE)((UINT)b * a / 255);
            dstPx[off + 1] = (BYTE)((UINT)g * a / 255);
            dstPx[off + 2] = (BYTE)((UINT)r * a / 255);
            dstPx[off + 3] = a;
        }
    }

    free(buf); free(tmp);
    return dst;
}

HBITMAP CreateBlackAlpha(HBITMAP src)
{
    BITMAP bm; GetObject(src, sizeof(bm), &bm);
    if (bm.bmBitsPixel != 32) return NULL;
    BITMAPINFO bmi; ZeroMemory(&bmi, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = bm.bmWidth;
    bmi.bmiHeader.biHeight = -bm.bmHeight;
    bmi.bmiHeader.biPlanes = 1; bmi.bmiHeader.biBitCount = 32; bmi.bmiHeader.biCompression = BI_RGB;
    void *bits = NULL;
    HDC dc = GetDC(NULL);
    HBITMAP dst = CreateDIBSection(dc, &bmi, DIB_RGB_COLORS, &bits, NULL, 0);
    ReleaseDC(NULL, dc);
    if (!dst || !bits) { if (dst) DeleteObject(dst); return NULL; }
    BYTE *sp = (BYTE*)bm.bmBits, *dp = (BYTE*)bits;
    UINT stride = bm.bmWidth * 4;
    for (UINT y = 0; y < (UINT)bm.bmHeight; y++)
        for (UINT x = 0; x < (UINT)bm.bmWidth; x++) {
            UINT o = y * stride + x * 4;
            BYTE a = sp[o + 3];
            dp[o + 0] = dp[o + 1] = dp[o + 2] = 0;
            dp[o + 3] = a;
        }
    return dst;
}

HBITMAP LoadImageFile(const char *path)
{
    if (!path || !path[0]) return NULL;
    wchar_t wpath[MAX_PATH];
    MultiByteToWideChar(CP_ACP, 0, path, -1, wpath, MAX_PATH);

    IWICImagingFactory *factory = NULL;
    IWICBitmapDecoder *decoder = NULL;
    IWICBitmapFrameDecode *frame = NULL;
    IWICFormatConverter *converter = NULL;
    HBITMAP hbmp = NULL;

    HRESULT hr = CoCreateInstance(CLSID_WICImagingFactory, NULL, CLSCTX_INPROC_SERVER,
                                  IID_IWICImagingFactory, (void**)&factory);
    if (FAILED(hr) || !factory) goto cleanup;
    hr = factory->CreateDecoderFromFilename(wpath, NULL, GENERIC_READ,
                                            WICDecodeMetadataCacheOnLoad, &decoder);
    if (FAILED(hr) || !decoder) goto cleanup;
    hr = decoder->GetFrame(0, &frame);
    if (FAILED(hr) || !frame) goto cleanup;
    hr = factory->CreateFormatConverter(&converter);
    if (FAILED(hr) || !converter) goto cleanup;
    hr = converter->Initialize(frame, GUID_WICPixelFormat32bppBGRA,
                               WICBitmapDitherTypeNone, NULL, 0.0, WICBitmapPaletteTypeCustom);
    if (FAILED(hr)) goto cleanup;

    UINT w = 0, h = 0;
    converter->GetSize(&w, &h);
    if (w == 0 || h == 0) goto cleanup;

    BITMAPINFO bmi;
    ZeroMemory(&bmi, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = (LONG)w;
    bmi.bmiHeader.biHeight = -(LONG)h;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;

    void *bits = NULL;
    HDC dc = GetDC(NULL);
    hbmp = CreateDIBSection(dc, &bmi, DIB_RGB_COLORS, &bits, NULL, 0);
    ReleaseDC(NULL, dc);
    if (!hbmp || !bits) { hbmp = NULL; goto cleanup; }

    UINT stride = w * 4;
    hr = converter->CopyPixels(NULL, stride, stride * h, (BYTE*)bits);
    if (FAILED(hr)) { DeleteObject(hbmp); hbmp = NULL; goto cleanup; }

    BYTE *px = (BYTE*)bits;
    for (UINT yp = 0; yp < h; yp++)
        for (UINT xp = 0; xp < w; xp++) {
            UINT off = yp * stride + xp * 4;
            BYTE a = px[off + 3];
            if (a == 0) px[off+0] = px[off+1] = px[off+2] = 0;
            else if (a < 255) {
                px[off+0] = (BYTE)((UINT)px[off+0] * a / 255);
                px[off+1] = (BYTE)((UINT)px[off+1] * a / 255);
                px[off+2] = (BYTE)((UINT)px[off+2] * a / 255);
            }
        }

cleanup:
    if (converter) converter->Release();
    if (frame) frame->Release();
    if (decoder) decoder->Release();
    if (factory) factory->Release();
    return hbmp;
}

void DrawImageSector(HDC dc, int idx)
{
    HBITMAP bmp = g_bitmaps[g_menuType][g_curPage][idx][0];
    if (!bmp) return;
    BITMAP bm; GetObject(bmp, sizeof(bm), &bm);

    int ct = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2;
    int so = SO_BASE * g_menuScale[g_menuType] / 100;
    int dz = DZ_BASE * g_menuScale[g_menuType] / 100;

    double a = g_sectorCenter[idx];
    int midR = dz + (int)((so - dz) * g_imgDist[g_menuType] / 100);
    int cx = ct + (int)(midR * cos(a));
    int cy = ct + (int)(midR * sin(a));
    int sz = (so / 2) * g_imgSize[g_menuType][g_curPage][idx] * 40 / 10000;
    if (sz < 4) sz = 4;
    int x = cx - sz / 2, y = cy - sz / 2;

    HDC ic = CreateCompatibleDC(dc);
    HBITMAP ob = (HBITMAP)SelectObject(ic, bmp);
    SetStretchBltMode(dc, HALFTONE);

    BLENDFUNCTION bf = {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA};

    if (idx == g_hover) {
        int glowInten = g_glowIntensity[g_menuType];
        COLORREF glClr = (COLORREF)g_glowColor[g_menuType];
        HBITMAP glBmp = CreateGlowFromAlpha(bmp, glClr, glowInten);
        if (glBmp) {
            BITMAP gbm; GetObject(glBmp, sizeof(gbm), &gbm);
            HDC glDc = CreateCompatibleDC(dc);
            HBITMAP glOb = (HBITMAP)SelectObject(glDc, glBmp);
            BLENDFUNCTION glBf = {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA};
            int glx = x - (gbm.bmWidth - sz) / 2, gly = y - (gbm.bmHeight - sz) / 2;
            AlphaBlend(dc, glx, gly, gbm.bmWidth, gbm.bmHeight, glDc, 0, 0, gbm.bmWidth, gbm.bmHeight, glBf);
            SelectObject(glDc, glOb); DeleteDC(glDc); DeleteObject(glBmp);
        }

        HBITMAP blk = CreateBlackAlpha(bmp);
        if (blk) {
            HDC blkDc = CreateCompatibleDC(dc);
            HBITMAP blkOb = (HBITMAP)SelectObject(blkDc, blk);
            BLENDFUNCTION blkBf = {AC_SRC_OVER, 0, 160, AC_SRC_ALPHA};
            AlphaBlend(dc, x + 4, y + 4, sz, sz, blkDc, 0, 0, bm.bmWidth, bm.bmHeight, blkBf);
            SelectObject(blkDc, blkOb); DeleteDC(blkDc); DeleteObject(blk);
        }
    }

    AlphaBlend(dc, x, y, sz, sz, ic, 0, 0, bm.bmWidth, bm.bmHeight, bf);

    SelectObject(ic, ob); DeleteDC(ic);
}

int HitTestSector(int mx, int my)
{
    int ct = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2;
    int so = SO_BASE * g_menuScale[g_menuType] / 100;
    int dz = DZ_BASE * g_menuScale[g_menuType] / 100;
    double dx = (double)(mx - ct), dy = (double)(my - ct);
    double dist = sqrt(dx * dx + dy * dy);
    if (dist < dz || dist > so) return -1;
    double a = atan2(dy, dx);
    double halfStep = M_PI / g_itemCount;
    double shifted = a + M_PI / 2.0 + halfStep;
    if (shifted < 0) shifted += 2.0 * M_PI;
    if (shifted >= 2.0 * M_PI) shifted -= 2.0 * M_PI;
    return ((int)(shifted / (2.0 * M_PI / g_itemCount))) % g_itemCount;
}

int HitTestSectorExtended(int mx, int my)
{
    int ct = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2;
    int dz = DZ_BASE * g_menuScale[g_menuType] / 100;
    double dx = (double)(mx - ct), dy = (double)(my - ct);
    double dist = sqrt(dx * dx + dy * dy);
    if (dist < dz) return -1;
    double a = atan2(dy, dx);
    double halfStep = M_PI / g_itemCount;
    double shifted = a + M_PI / 2.0 + halfStep;
    if (shifted < 0) shifted += 2.0 * M_PI;
    if (shifted >= 2.0 * M_PI) shifted -= 2.0 * M_PI;
    return ((int)(shifted / (2.0 * M_PI / g_itemCount))) % g_itemCount;
}

// Get persistent device path for a Raw Input handle
static void GetDevicePath(HANDLE hDevice, char *out, int outSz)
{
    out[0] = 0;
    UINT sz = 0;
    GetRawInputDeviceInfo(hDevice, RIDI_DEVICENAME, NULL, &sz);
    if (sz > 0 && sz < (UINT)outSz) {
        wchar_t *wname = (wchar_t*)malloc(sz * sizeof(wchar_t));
        if (wname) {
            GetRawInputDeviceInfo(hDevice, RIDI_DEVICENAME, wname, &sz);
            WideCharToMultiByte(CP_UTF8, 0, wname, -1, out, outSz, NULL, NULL);
            free(wname);
        }
    }
}

void ListNumpadDevices(void)
{
    char path[MAX_PATH * 4];
    GetSettingsPath(path, sizeof(path));
    // Find last backslash, append device list filename
    char *slash = strrchr(path, '\\');
    if (!slash) slash = strrchr(path, '/');
    if (slash) slash[1] = 0;
    strcat_s(path, sizeof(path), "devices.txt");

    FILE *f = NULL; fopen_s(&f, path, "w");
    if (!f) return;

    fprintf(f, "PieMenu v1.01 - Connected Keyboard Devices\n");
    fprintf(f, "============================================\n\n");

    UINT devCount = 0;
    GetRawInputDeviceList(NULL, &devCount, sizeof(RAWINPUTDEVICELIST));
    if (devCount == 0) {
        fprintf(f, "No Raw Input devices found.\n");
        fclose(f);
        MessageBoxA(NULL, "No keyboard devices detected.\nFile: devices.txt\n(see PieMenu settings folder)", "Numpad Devices", MB_OK | MB_ICONINFORMATION);
        return;
    }

    RAWINPUTDEVICELIST *devList = (RAWINPUTDEVICELIST*)malloc(devCount * sizeof(RAWINPUTDEVICELIST));
    if (!devList) { fclose(f); return; }
    GetRawInputDeviceList(devList, &devCount, sizeof(RAWINPUTDEVICELIST));

    int kbIdx = 0;
    for (UINT i = 0; i < devCount; i++) {
        if (devList[i].dwType == RIM_TYPEKEYBOARD) {
            RID_DEVICE_INFO info; UINT infoSz = sizeof(info);
            UINT nameSz = 0;
            GetRawInputDeviceInfo(devList[i].hDevice, RIDI_DEVICENAME, NULL, &nameSz);
            char devName[1024] = {0};
            if (nameSz > 0 && nameSz < sizeof(devName)) {
                wchar_t *wname = (wchar_t*)malloc(nameSz * sizeof(wchar_t));
                if (wname) {
                    GetRawInputDeviceInfo(devList[i].hDevice, RIDI_DEVICENAME, wname, &nameSz);
                    WideCharToMultiByte(CP_UTF8, 0, wname, -1, devName, sizeof(devName), NULL, NULL);
                    free(wname);
                }
            }
            if (GetRawInputDeviceInfo(devList[i].hDevice, RIDI_DEVICEINFO, &info, &infoSz) >= 0) {
                fprintf(f, "--- Keyboard #%d ---\n", ++kbIdx);
                fprintf(f, "DevicePath=%s\n", devName[0] ? devName : "(unknown)");
                fprintf(f, "KeyCount=%d  FunctionKeyCount=%d\n\n",
                    info.keyboard.dwNumberOfKeysTotal, info.keyboard.dwNumberOfFunctionKeys);
            }
        }
    }
    free(devList);
    fclose(f);

    char msg[2048];
    _snprintf_s(msg, sizeof(msg), _TRUNCATE,
        "Keyboard devices have been written to:\n%s\n\n"
        "Open this file to see all connected keyboards.\n\n"
        "HOW TO USE:\n"
        "1. Press a key on your external numpad\n"
        "2. Check the file to identify which keyboard\n"
        "   received the key (DevicePath line)\n"
        "3. Copy that full DevicePath into PieMenu_settings.cfg:\n"
        "   numpad_device_path=<paste here>\n"
        "4. Restart AE or wait for next IdleHook reload",
        path);
    MessageBoxA(NULL, msg, "Numpad Devices - PieMenu", MB_OK | MB_ICONINFORMATION);
}

void InitRawWindow(void)
{
    if (g_rawWnd) return;
    WNDCLASS wc = {0}; wc.lpfnWndProc = RawWndProc; wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = "WB_RawClass";
    if (!RegisterClass(&wc) && GetLastError() != ERROR_CLASS_ALREADY_EXISTS) return;
    g_rawWnd = CreateWindowEx(WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE, "WB_RawClass", "", WS_POPUP, 0, 0, 1, 1, NULL, NULL, GetModuleHandle(NULL), NULL);
    if (g_rawWnd) {
        RAWINPUTDEVICE rid; rid.usUsagePage = 0x01; rid.usUsage = 0x06;
        rid.dwFlags = RIDEV_INPUTSINK; rid.hwndTarget = g_rawWnd;
        RegisterRawInputDevices(&rid, 1, sizeof(rid));
        RegisterTriggerHotkey();
    }
}

LRESULT CALLBACK RawWndProc(HWND hwnd, UINT msg, WPARAM w, LPARAM l)
{
    if (msg == WM_HOTKEY && w == 0) {
        ShowMenu(); return 0;
    }
    if (msg == WM_INPUT) {
        UINT sz = 0; GetRawInputData((HRAWINPUT)l, RID_INPUT, NULL, &sz, sizeof(RAWINPUTHEADER));
        if (sz) {
            RAWINPUT *ri = (RAWINPUT*)malloc(sz);
            if (GetRawInputData((HRAWINPUT)l, RID_INPUT, ri, &sz, sizeof(RAWINPUTHEADER)) == sz) {
                if (ri->header.dwType == RIM_TYPEKEYBOARD) {
                    HANDLE dev = ri->header.hDevice;
                    WORD vk = ri->data.keyboard.VKey;
                    // Numpad keys auto-enable interception
                    if (vk >= VK_NUMPAD0 && vk <= VK_NUMPAD9 || vk == VK_RETURN || vk == VK_ADD || vk == VK_SUBTRACT || vk == VK_MULTIPLY || vk == VK_DIVIDE)
                        g_numpadEnabled = true;
                    if (!g_numpadEnabled) { free(ri); return 0; }
                    // Check if this device matches the configured numpad
                    bool match = false;
                    if (g_numpadDevicePath[0]) {
                        char devPath[512] = {0};
                        GetDevicePath(dev, devPath, sizeof(devPath));
                        match = (strcmp(devPath, g_numpadDevicePath) == 0);
                        if (match) g_numpadHandle = dev;
                    } else if (g_numpadPairing) {
                        // Pairing mode: first numpad key from any device pairs it
                        if (vk >= VK_NUMPAD0 && vk <= VK_NUMPAD9) {
                            g_numpadHandle = dev;
                            GetDevicePath(dev, g_numpadDevicePath, sizeof(g_numpadDevicePath));
                            g_numpadPairing = false;
                            BOOL up = (ri->data.keyboard.Flags & RI_KEY_BREAK);
                            if (!up) {
                                MessageBoxA(NULL, "Numpad paired! You can now use numpad Enter to open menus.", "PieMenu", MB_OK | MB_ICONINFORMATION);
                            }
                            SavePairingToFile();
                        }
                        match = (dev == g_numpadHandle);
                    } else {
                        // Not paired yet — do NOT auto-detect, do NOT match Enter
                        match = (dev == g_numpadHandle);
                    }
                    if (match) {
                        // Numpad Enter → show menu (key-down only, key-up also consumed)
                        if (g_numpadEnterAction && vk == VK_RETURN) {
                            BOOL up = (ri->data.keyboard.Flags & RI_KEY_BREAK);
                            if (!up) {
                                INPUT sup = {0};
                                sup.type = INPUT_KEYBOARD; sup.ki.wVk = VK_RETURN; sup.ki.dwFlags = KEYEVENTF_KEYUP;
                                SendInput(1, &sup, sizeof(INPUT));
                                g_numpadTriggered = true;
                                ShowMenu();
                                g_numpadTriggered = false;
                                free(ri); return 0;
                            }
                            free(ri); return 0; // also consume key-up
                        }
                        // Numpad 0-9 → select grid slot, or fallback to F13-F21
                        if (vk >= VK_NUMPAD0 && vk <= VK_NUMPAD9) {
                            BOOL up = (ri->data.keyboard.Flags & RI_KEY_BREAK);
                            if (g_hwnd && g_menuType == MENU_QUICK && g_quickStyle == 1) {
                                if (!up) {
                                    static const int numpadToGrid[] = {9,6,7,8,3,4,5,0,1,2};
                                    int gi = numpadToGrid[vk - VK_NUMPAD0];
                                    if (gi < g_itemCount) SelectItem(gi);
                                }
                                free(ri); return 0;
                            }
                            // non-grid: forward as F13-F21
                            int idx = vk - VK_NUMPAD0;
                            WORD fKey = VK_F13 + idx;
                            INPUT in[2] = {0};
                            in[0].type = INPUT_KEYBOARD; in[0].ki.wVk = vk; in[0].ki.dwFlags = KEYEVENTF_KEYUP;
                            in[1].type = INPUT_KEYBOARD; in[1].ki.wVk = fKey;
                            if (up) in[1].ki.dwFlags = KEYEVENTF_KEYUP;
                            SendInput(2, in, sizeof(INPUT));
                            free(ri); return 0;
                        }
                        // Numpad extras when grid menu is showing
                        if (g_hwnd && g_menuType == MENU_QUICK && g_quickStyle == 1) {
                            BOOL up = (ri->data.keyboard.Flags & RI_KEY_BREAK);
                            if (!up) {
                                int gi = -1;
                                if (vk == VK_DIVIDE)   gi = 10;  // / keypad
                                if (vk == VK_MULTIPLY) gi = 11;  // * keypad
                                if (vk == VK_BACK)     gi = 12;  // Backspace
                                if (vk == VK_DELETE)   gi = 13;  // Del
                                if (gi >= 0 && gi < g_itemCount) { SelectItem(gi); free(ri); return 0; }
                            }
                            // Page turn: +/- keys
                            if (!up) {
                                if (vk == VK_ADD || vk == VK_MULTIPLY) { GotoPage(g_curPage + 1); free(ri); return 0; }
                                if (vk == VK_SUBTRACT || vk == VK_DIVIDE) { GotoPage(g_curPage - 1); free(ri); return 0; }
                            }
                        }
                    }
                }
            }
            free(ri);
        }
    }
    return DefWindowProc(hwnd, msg, w, l);
}

void ShowMenu(void)
{
    // Allow repeat: if numpad-triggered and old window exists, destroy it first
    if (g_hwnd) {
        if (g_numpadTriggered) {
            HWND h = g_hwnd; g_hwnd = NULL; g_hover = -1; DestroyWindow(h);
        } else {
            return;
        }
    }
    // Numpad Enter trigger: override menu type and force click mode (no release-to-select)
    if (g_numpadTriggered && g_numpadEnterAction >= 1 && g_numpadEnterAction <= 4) {
        static const int actionToMenu[] = {0, 1, 2, 0, 3}; // 1=Quick,2=Wheel,3=Pie,4=Infinite
        g_menuType = actionToMenu[g_numpadEnterAction];
        g_selectMode = 0;
        if (g_menuType == MENU_QUICK) { g_quickStyle = 1; if (g_quickCount < 14) g_quickCount = 14; } // numpad grid
    }
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    if (g_menuType == MENU_QUICK && g_quickStyle == 1) ws = 380;
    int ct = ws / 2;
    switch (g_menuType) {
        case MENU_PIE:   g_itemCount = g_pieCount; break;
        case MENU_QUICK: g_itemCount = g_quickCount; break;
        case MENU_WHEEL: g_itemCount = 8; break;
        case MENU_INFINITE: { int r2s2 = (g_infiniteSplitR2 < 0) ? 1 : 2; int r3s2 = (g_infiniteSplitR3 < 2) ? 1 : g_infiniteSplitR3; g_itemCount = g_infiniteSectors * (1 + r2s2 + r3s2); } break;
    }
    InitBrushes(); LoadBitmaps();

    WNDCLASS wc = {0}; wc.hInstance = GetModuleHandle(NULL); wc.hCursor = LoadCursor(NULL, IDC_ARROW);

    const char *cls = NULL;
    switch (g_menuType) {
        case MENU_PIE:   cls = "WB_PieClass"; break;
        case MENU_QUICK: cls = "WB_QuickClass"; break;
        case MENU_WHEEL: cls = "WB_WheelClass"; break;
        case MENU_INFINITE: cls = "WB_InfiniteClass"; break;
    }
    if (!g_class_registered[g_menuType]) {
        wc.lpfnWndProc = [](HWND h, UINT m, WPARAM w, LPARAM l) -> LRESULT {
            switch (m) {
                case WM_PAINT: { PAINTSTRUCT ps; HDC dc = BeginPaint(h, &ps);
                    if (g_menuType == MENU_PIE) DrawPie(dc);
                    else if (g_menuType == MENU_QUICK) DrawQuick(dc);
                    else if (g_menuType == MENU_WHEEL) DrawWheel(dc);
                    else DrawInfinite(dc);
                    EndPaint(h, &ps); return 0; }
                case WM_ERASEBKGND: return 1;
                case WM_MOUSEMOVE: {
                    int x = GET_X_LPARAM(l), y = GET_Y_LPARAM(l);
                    g_mouseX = x; g_mouseY = y;
                    int hov = -1;
                    if (g_menuType == MENU_PIE) {
                        if (g_selectMode == 1) hov = HitTestSectorExtended(x, y);
                        else hov = HitTestSector(x, y);
                        double dx = (double)(x - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2)), dy = (double)(y - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2));
                        if (sqrt(dx*dx+dy*dy) > 2.0) g_arcAngleDeg = atan2(dy,dx)*180.0/M_PI;
                        g_cursorAngle = g_arcAngleDeg;
                    }
                    else if (g_menuType == MENU_QUICK) {
                        hov = HitTestQuick(x, y);
                        double dx = (double)(x - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2)), dy = (double)(y - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2));
                        if (sqrt(dx*dx+dy*dy) > 2.0) g_cursorAngle = atan2(dy,dx)*180.0/M_PI;
                    }
                    else if (g_menuType == MENU_WHEEL) {
                        hov = HitTestWheel(x, y);
                        double dx = (double)(x - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2)), dy = (double)(y - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2));
                        if (sqrt(dx*dx+dy*dy) > 2.0) g_cursorAngle = atan2(dy,dx)*180.0/M_PI;
                    }
                    else if (g_menuType == MENU_INFINITE) {
                        hov = HitTestInfinite(x, y);
                        if (hov >= 0) { g_infiniteHoverSlot = hov; g_infiniteHoverSector = g_hitAreas[hov].sector; }
                        else { g_infiniteHoverSlot = -1; g_infiniteHoverSector = -1; }
                        int wsi = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
                        int cti = wsi / 2;
                        g_cursorAngle = atan2((double)(y - cti), (double)(x - cti)) * 180.0 / M_PI;
                    }
                    g_hover = hov; InvalidateRect(h, NULL, FALSE);
                    TRACKMOUSEEVENT tme = {sizeof(tme), TME_LEAVE, h, 0};
                    TrackMouseEvent(&tme); return 0; }
                case WM_MOUSELEAVE: { if (g_hover != -1 && g_selectMode != 1) { g_hover = -1; g_infiniteHoverSlot = -1; g_infiniteHoverSector = -1; InvalidateRect(h, NULL, FALSE); } break; }
                case WM_LBUTTONDOWN: {
                    if (g_selectMode == 1) return 0;
                    int x = GET_X_LPARAM(l), y = GET_Y_LPARAM(l);
                    int idx = -1;
                    if (g_menuType == MENU_PIE) idx = HitTestSector(x, y);
                    else if (g_menuType == MENU_QUICK) idx = HitTestQuick(x, y);
                    else if (g_menuType == MENU_WHEEL) idx = HitTestWheel(x, y);
                    else idx = HitTestInfinite(x, y);
                    if (idx >= 0) SelectItem(idx); else HideMenu(); return 0; }
                case WM_RBUTTONDOWN: HideMenu(); return 0;
                case WM_KEYDOWN: {
                    if (w == VK_ESCAPE) { HideMenu(); return 0; }
                    if (w == g_prevPageKey || (w >= 'a' && w <= 'z' && w == g_prevPageKey + 32)) { GotoPage(g_curPage - 1); return 0; }
                    if (w == g_nextPageKey || (w >= 'a' && w <= 'z' && w == g_nextPageKey + 32)) { GotoPage(g_curPage + 1); return 0; }
                    if (w >= '1' && w <= '9') {
                        int idx = (int)(w - '1');
                        if (idx < g_itemCount) { SelectItem(idx); return 0; }
                    }
                    for (int si = 0; si < g_itemCount; si++) {
                        if (g_slotKey[g_menuType][g_curPage][si] && (int)w == g_slotKey[g_menuType][g_curPage][si]) {
                            if (g_slotMod[g_menuType][g_curPage][si] == 0 || (GetAsyncKeyState(g_slotMod[g_menuType][g_curPage][si]) & 0x8000)) {
                                SelectItem(si); return 0;
                            }
                        }
                    }
                    break;
                }
                case WM_TIMER:
                     if (w == TIMEOUT_TID) { HideMenu(); return 0; }
                     if (w == HOLD_TID) {
                          if (GetAsyncKeyState(g_triggerKey) & 0x8000) { return 0; }
                          KillTimer(h, HOLD_TID);
                          if (g_hover >= 0) { SelectItem(g_hover); }
                          else { HideMenu(); }
                          return 0;
                      }
                     break;
                case WM_CAPTURECHANGED: {
                    if (g_hwnd) { HWND h = g_hwnd; g_hwnd = NULL; g_hover = -1; DestroyWindow(h); }
                    return 0;
                }
                case WM_CLOSE: CancelTimer(); DestroyWindow(h); return 0;
                case WM_NCDESTROY: g_hwnd = NULL; break;
            }
            return DefWindowProc(h, m, w, l);
        };
        wc.lpszClassName = cls;
        RegisterClass(&wc);
        g_class_registered[g_menuType] = true;
    }

    InitLayout();
    POINT pt; GetCursorPos(&pt);
    int posX = pt.x - ct, posY = pt.y - ct;
    int sw = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
    if (posX + ws > sw) posX = sw - ws; if (posX < 0) posX = 0;
    if (posY + ws > sh) posY = sh - ws; if (posY < 0) posY = 0;

    g_hwnd = CreateWindowEx(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, cls, "", WS_POPUP, posX, posY, ws, ws, NULL, NULL, GetModuleHandle(NULL), NULL);
    if (!g_hwnd) return;
    SetLayeredWindowAttributes(g_hwnd, RGB(0,0,0), (BYTE)(g_winAlpha * 255 / 100), LWA_ALPHA | LWA_COLORKEY);
    SetCapture(g_hwnd); ShowWindow(g_hwnd, SW_SHOW); UpdateWindow(g_hwnd);
    if (g_menuType == MENU_INFINITE) {
        SetTimer(g_hwnd, HOLD_TID, 30, NULL);
    } else if (g_selectMode == 1) {
        SetTimer(g_hwnd, HOLD_TID, 30, NULL);
    } else {
        ResetTimer();
    }
    POINT cur; GetCursorPos(&cur); ScreenToClient(g_hwnd, &cur);
    g_mouseX = cur.x; g_mouseY = cur.y;
    if (g_menuType == MENU_PIE) {
        double dx = (double)(cur.x - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2)), dy = (double)(cur.y - (WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2));
        if (sqrt(dx*dx+dy*dy) > 2.0) g_arcAngleDeg = atan2(dy,dx)*180.0/M_PI;
        g_cursorAngle = g_arcAngleDeg;
        g_hover = HitTestSector((int)cur.x, (int)cur.y);
    } else if (g_menuType == MENU_QUICK) {
        g_hover = HitTestQuick((int)cur.x, (int)cur.y);
        g_cursorAngle = g_arcAngleDeg;
    } else if (g_menuType == MENU_WHEEL) {
        g_hover = HitTestWheel((int)cur.x, (int)cur.y);
        g_cursorAngle = g_arcAngleDeg;
    } else if (g_menuType == MENU_INFINITE) {
        g_hover = HitTestInfinite((int)cur.x, (int)cur.y);
        g_infiniteHoverSlot = g_hover;
        g_infiniteHoverSector = (g_hover >= 0) ? g_hitAreas[g_hover].sector : -1;
        int ws2 = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
        int ct2 = ws2 / 2;
        g_cursorAngle = atan2((double)(cur.y - ct2), (double)(cur.x - ct2)) * 180.0 / M_PI;
    }
    InvalidateRect(g_hwnd, NULL, FALSE);
}
