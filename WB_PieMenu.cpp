#include "WB_PieMenu.h"
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
#define MAX_ITEMS     9
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

enum MenuType { MENU_PIE = 0, MENU_QUICK = 1, MENU_WHEEL = 2 };

static AEGP_Command   S_pi_cmd[5] = {0};
static AEGP_PluginID  S_id        = 0L;
static SPBasicSuite   *sP         = NULL;
static HWND           g_hwnd      = NULL;
static HWND           g_rawWnd    = NULL;
static int            g_hover     = -1;
static bool           g_class_registered[3] = {false};

static int  g_menuType   = MENU_PIE;
static int  g_itemCount  = 4;
static int  g_pieCount   = 4;
static int  g_quickCount = 6;
static int  g_curPage    = 0;
static int  g_totalPages = 3;

static char g_names  [3][MAX_PAGES][MAX_ITEMS][64];
static char g_effects[3][MAX_PAGES][MAX_ITEMS][256];
static char g_imgNorm[3][MAX_PAGES][MAX_ITEMS][512];
static char g_imgHovr[3][MAX_PAGES][MAX_ITEMS][512];
static int  g_imgSize[3][MAX_PAGES][MAX_ITEMS]; // 0-200%, default 80

static int   g_triggerKey = 32, g_triggerMod = 6;
static int   g_prevPageKey = 90, g_nextPageKey = 88; // Z, X
static int   g_winAlpha = 60;      // 0-100, window opacity
static int   g_bgAlpha = 60;       // 0-100, sector fill opacity only
static int   g_bgColor = 0x2A2A2A;
static int   g_glowColor = 0x3CB93C;
static int   g_glowIntensity = 100;
static int   g_imgDist = 45;       // 20-80%, icon distance from center
static int   g_textDist = 85;      // 30-90%, text distance from center
static int   g_menuScale = 100;
static int   g_textSize = 100;      // 50-150%, pie text font size
static bool  g_numpadEnabled = false;
static HANDLE g_numpadHandle = NULL;
static char  g_numpadName[128] = {0};

static COLORREF g_palette[MAX_ITEMS] = {
    RGB(220,80,80), RGB(70,200,70), RGB(60,120,230), RGB(230,190,50),
    RGB(180,60,180), RGB(60,200,200), RGB(240,140,40), RGB(160,160,160), RGB(200,200,200)
};
static HBRUSH   g_brushes[MAX_ITEMS] = {0};
static HBITMAP  g_bitmaps[3][MAX_PAGES][MAX_ITEMS][2] = {{{{0}}}};
static double   g_sectorStart[MAX_ITEMS], g_sectorEnd[MAX_ITEMS], g_sectorCenter[MAX_ITEMS];
static bool     g_layoutInit = false;
static double   g_arcAngleDeg = -90.0;
static int      g_pendingItem = -1;
static UINT_PTR g_timerId = 0;

static const UINT_PTR TIMEOUT_TID = 101;

static char  g_saveEffPath[MAX_PATH] = {0};
static char  g_applyEffPath[MAX_PATH] = {0};
static bool  g_saveEffPending = false;
static bool  g_applyEffPending = false;
static char  g_effResult[64] = {0};
static char  g_svPath[MAX_PATH] = {0};

#define WBEFF_MAGIC   0x46454257
#define WBEFF_FLOAT   1
#define WBEFF_2D      2
#define WBEFF_3D      3
#define WBEFF_COLOR   4
#define WBEFF_DROPDOWN 5
#define WBEFF_BOOL    6

static void GetSettingsPath(char *, int);

static void WriteEffResult(const char *r)
{
    strncpy_s(g_effResult, sizeof(g_effResult), r, _TRUNCATE);
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "a");
    if (f) { fprintf(f, "save_eff_result=%s\n", r); fclose(f); }
}

static bool SaveWBEFF(const char *wp, AEGP_LayerH lh)
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

static bool ApplyWBEFF(const char *wp, AEGP_LayerH lh)
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
                // Force effect to process new param values (especially needed for built-in effects)
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

static void LoadSettings(void);

static void DoSaveEff(void)
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

static void LoadSettings(void);

static void DoApplyEff(void)
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

// ?????? Settings path ??????????????????????????????????????????????????????????????????????????????????????????????????
static void GetSettingsPath(char *buf, int sz)
{
    char a[MAX_PATH]; GetEnvironmentVariableA("LOCALAPPDATA", a, sizeof(a));
    _snprintf_s(buf, sz, _TRUNCATE, "%s\\WB_PieMenu\\settings.txt", a);
}

static void DefaultsForMenu(int m)
{
    for (int p = 0; p < MAX_PAGES; p++)
        for (int i = 0; i < MAX_ITEMS; i++) {
            _snprintf_s(g_names[m][p][i], 64, _TRUNCATE, "Item %d", i + 1);
            g_effects[m][p][i][0] = 0;
            g_imgNorm[m][p][i][0] = 0;
            g_imgHovr[m][p][i][0] = 0;
            g_imgSize[m][p][i] = 80;
        }
}

static void SetVal(const char *key, const char *val)
{
    int m = -1, p = 0, i = 0;
    char rest[64] = {0};
    if (sscanf_s(key, "pie_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_PIE;
    else if (sscanf_s(key, "quick_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_QUICK;
    else if (sscanf_s(key, "wheel_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_WHEEL;
    else if (strcmp(key, "menu_type") == 0) { g_menuType = atoi(val); return; }
    else if (strcmp(key, "pie_count") == 0) { int n = atoi(val); if (n >= 2 && n <= 8) g_pieCount = n; return; }
    else if (strcmp(key, "quick_count") == 0) { int n = atoi(val); if (n >= 1 && n <= 9) g_quickCount = n; return; }
    else if (strcmp(key, "trigger_key") == 0) { g_triggerKey = atoi(val); return; }
    else if (strcmp(key, "trigger_mod") == 0) { g_triggerMod = atoi(val); return; }
    else if (strcmp(key, "prev_page_key") == 0) { int n = atoi(val); if (n > 0) g_prevPageKey = n; return; }
    else if (strcmp(key, "next_page_key") == 0) { int n = atoi(val); if (n > 0) g_nextPageKey = n; return; }
    else if (strcmp(key, "win_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_winAlpha = n; return; }
    else if (strcmp(key, "bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_bgAlpha = n; return; }
    else if (strcmp(key, "bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_bgColor = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_glowColor = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) g_glowIntensity = n; return; }
    else if (strcmp(key, "img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) g_imgDist = n; return; }
    else if (strcmp(key, "text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) g_textDist = n; return; }
    else if (strcmp(key, "text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_textSize = n; return; }
    else if (strcmp(key, "menu_scale") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_menuScale = n; return; }
    else if (strcmp(key, "numpad_enabled") == 0) { g_numpadEnabled = (atoi(val) != 0); return; }
    else if (strcmp(key, "numpad_handle") == 0) { g_numpadHandle = (HANDLE)(INT_PTR)_strtoui64(val, NULL, 16); return; }
    else if (strcmp(key, "numpad_name") == 0) { strncpy_s(g_numpadName, sizeof(g_numpadName), val, _TRUNCATE); return; }
    else if (strcmp(key, "item_count") == 0) { int n = atoi(val); if (n >= 2 && n <= 8) g_pieCount = n; return; }
    else if (strcmp(key, "save_eff_path") == 0) { strncpy_s(g_saveEffPath, sizeof(g_saveEffPath), val, _TRUNCATE); return; }
    else if (strcmp(key, "apply_eff_path") == 0) { strncpy_s(g_applyEffPath, sizeof(g_applyEffPath), val, _TRUNCATE); return; }
    else if (strcmp(key, "save_eff_pending") == 0) { g_saveEffPending = (atoi(val) != 0); return; }
    else if (strcmp(key, "apply_eff_pending") == 0) { g_applyEffPending = (atoi(val) != 0); return; }
    // back-compat: old format n0=Name, n0_effect=MatchName
    if (key[0] == 'n' && key[1] >= '0' && key[1] <= '8') {
        int i2 = key[1] - '0';
        const char *r = key + 2;
        if (*r == 0) strncpy_s(g_names[MENU_PIE][0][i2], 64, val, _TRUNCATE);
        else if (strcmp(r, "_effect") == 0) strncpy_s(g_effects[MENU_PIE][0][i2], 256, val, _TRUNCATE);
        else if (strcmp(r, "_image") == 0) strncpy_s(g_imgNorm[MENU_PIE][0][i2], 512, val, _TRUNCATE);
        else if (strcmp(r, "_image_hover") == 0) strncpy_s(g_imgHovr[MENU_PIE][0][i2], 512, val, _TRUNCATE);
        return;
    }
    if (m < 0 || p >= MAX_PAGES || i >= MAX_ITEMS) return;
    if (strcmp(rest, "n") == 0) strncpy_s(g_names[m][p][i], 64, val, _TRUNCATE);
    else if (strcmp(rest, "e") == 0) strncpy_s(g_effects[m][p][i], 256, val, _TRUNCATE);
    else if (strcmp(rest, "img") == 0) strncpy_s(g_imgNorm[m][p][i], 512, val, _TRUNCATE);
    else if (strcmp(rest, "imgh") == 0) strncpy_s(g_imgHovr[m][p][i], 512, val, _TRUNCATE);
    else if (strcmp(rest, "sz") == 0) { int n = atoi(val); if (n >= 20 && n <= 200) g_imgSize[m][p][i] = n; }
}

static void LoadSettings(void)
{
    for (int m = 0; m < 3; m++) DefaultsForMenu(m);
    g_menuType = MENU_PIE; g_itemCount = 4; g_curPage = 0;
    g_saveEffPending = false; g_applyEffPending = false;
    g_saveEffPath[0] = 0; g_applyEffPath[0] = 0;
    char path[MAX_PATH]; GetSettingsPath(path, sizeof(path));
    FILE *f = NULL; fopen_s(&f, path, "r"); if (!f) return;
    char line[1024];
    while (fgets(line, sizeof(line), f)) {
        char k[64] = {0}, v[960] = {0};
        if (sscanf_s(line, " %63[^=]=%959[^\r\n]", k, 64, v, 960) >= 1) SetVal(k, v);
    }
    fclose(f);
}

// ?????? Settings helpers (write section) ??????????????????????????????????????????????????????
static void WriteSection(FILE *f, const char *prefix, int pages, int count)
{
    for (int p = 0; p < pages; p++) {
        fprintf(f, "%s_count=%d\n", prefix, count);
        for (int i = 0; i < count; i++) {
            int m = (strcmp(prefix, "pie") == 0) ? MENU_PIE : (strcmp(prefix, "quick") == 0) ? MENU_QUICK : MENU_WHEEL;
            if (g_names[m][p][i][0]) fprintf(f, "%s_%d_%d_n=%s\n", prefix, p, i, g_names[m][p][i]);
            if (g_effects[m][p][i][0]) fprintf(f, "%s_%d_%d_e=%s\n", prefix, p, i, g_effects[m][p][i]);
            if (g_imgNorm[m][p][i][0]) fprintf(f, "%s_%d_%d_img=%s\n", prefix, p, i, g_imgNorm[m][p][i]);
            if (g_imgHovr[m][p][i][0]) fprintf(f, "%s_%d_%d_imgh=%s\n", prefix, p, i, g_imgHovr[m][p][i]);
            if (g_imgSize[m][p][i] != 80) fprintf(f, "%s_%d_%d_sz=%d\n", prefix, p, i, g_imgSize[m][p][i]);
        }
    }
}

// ?????? Hotkey ??????????????????????????????????????????????????????????????????????????????????????????????????????????
static void RegisterTriggerHotkey(void)
{
    if (g_rawWnd) {
        UnregisterHotKey(g_rawWnd, 0);
        if (g_triggerKey && g_triggerMod)
            RegisterHotKey(g_rawWnd, 0, g_triggerMod, g_triggerKey);
    }
}

// ?????? Bitmaps / Brushes ??????????????????????????????????????????????????????????????????????????????????
static void ClearBitmaps(void)
{
    for (int m = 0; m < 3; m++)
        for (int p = 0; p < MAX_PAGES; p++)
            for (int i = 0; i < MAX_ITEMS; i++)
                for (int j = 0; j < 2; j++)
                    if (g_bitmaps[m][p][i][j]) { DeleteObject(g_bitmaps[m][p][i][j]); g_bitmaps[m][p][i][j] = NULL; }
}

// ?????? Create outer glow bitmap from PNG alpha (box-blur the alpha) ??????
static HBITMAP CreateGlowFromAlpha(HBITMAP src, COLORREF color, int intensity)
{
    BITMAP bm; GetObject(src, sizeof(bm), &bm);
    if (bm.bmBitsPixel != 32) return NULL;

    int blurRadius = (intensity * 8 + 50) / 100; // 0 ??0, 100 ??8, 200 ??16
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

    // Step 1: Copy alpha into temp buffer padded
    BYTE *tmp = (BYTE*)malloc(gw * gh);
    if (!tmp) { DeleteObject(dst); return NULL; }
    memset(tmp, 0, gw * gh);
    for (UINT yp = 0; yp < sh; yp++)
        for (UINT xp = 0; xp < sw; xp++)
            tmp[(yp + blurRadius) * gw + (xp + blurRadius)] = srcPx[yp * sStride + xp * 4 + 3];

    // Step 2: Box blur (two passes for efficiency)
    BYTE *buf = (BYTE*)malloc(gw * gh);
    if (!buf) { free(tmp); DeleteObject(dst); return NULL; }
    for (int pass = 0; pass < 2; pass++) {
        // Horizontal
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
        // Vertical
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

    // Step 3: Write final pixels with pre-multiplied color
    int lumScale = (intensity * 192 + 50) / 100; // 0??0, 100??92, 200??55
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

// ????????? Dynamic size scaling ??????????????????????????????????????????????????????????????????????????????????????????????????????
// All layout constants multiply by g_menuScale / 100
#define WIN_SIZE_BASE  600
#define CENTER_BASE    300
#define SO_BASE        280  // SECTOR_OUTER base
#define DZ_BASE        30   // DEAD_ZONE base
#define RR_BASE        36   // RING_R base
#define QW_BASE        240  // QUICK_W base
#define QH_BASE        34   // QUICK_H base
#define WH_BASE        42   // WHEEL_BAR_H base
#define WA_BASE        90   // WHEEL_ARM base

// ????????? Create a black bitmap preserving source alpha (for drop shadow) ?????????
static HBITMAP CreateBlackAlpha(HBITMAP src)
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
            dp[o + 0] = dp[o + 1] = dp[o + 2] = 0; // black
            dp[o + 3] = a; // original alpha (pre-multiplied: 0*a=0)
        }
    return dst;
}

// ????????? Draw image in sector, with alpha-aware shadow + gold hover ?????????
static void DrawImageSector(HDC dc, int idx)
{
    HBITMAP bmp = g_bitmaps[g_menuType][g_curPage][idx][0];
    if (!bmp) return;
    BITMAP bm; GetObject(bmp, sizeof(bm), &bm);

    int ct = WIN_SIZE_BASE * g_menuScale / 100 / 2;
    int so = SO_BASE * g_menuScale / 100;
    int dz = DZ_BASE * g_menuScale / 100;

    double a = g_sectorCenter[idx];
    int midR = dz + (int)((so - dz) * g_imgDist / 100);
    int cx = ct + (int)(midR * cos(a));
    int cy = ct + (int)(midR * sin(a));
    // Image size: new formula where slider 100 = old 40% as baseline
    int sz = (so / 2) * g_imgSize[g_menuType][g_curPage][idx] * 40 / 10000;
    if (sz < 4) sz = 4;
    int x = cx - sz / 2, y = cy - sz / 2;

    HDC ic = CreateCompatibleDC(dc);
    HBITMAP ob = (HBITMAP)SelectObject(ic, bmp);
    SetStretchBltMode(dc, HALFTONE);

    BLENDFUNCTION bf = {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA};

    if (idx == g_hover) {
        // 1. Outer glow from alpha (blurred, user color, behind image)
        int glowInten = g_glowIntensity;
        COLORREF glClr = (COLORREF)g_glowColor;
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

        // 2. Drop shadow from alpha (pure black shape offset +4px)
        HBITMAP blk = CreateBlackAlpha(bmp);
        if (blk) {
            HDC blkDc = CreateCompatibleDC(dc);
            HBITMAP blkOb = (HBITMAP)SelectObject(blkDc, blk);
            BLENDFUNCTION blkBf = {AC_SRC_OVER, 0, 160, AC_SRC_ALPHA};
            AlphaBlend(dc, x + 4, y + 4, sz, sz, blkDc, 0, 0, bm.bmWidth, bm.bmHeight, blkBf);
            SelectObject(blkDc, blkOb); DeleteDC(blkDc); DeleteObject(blk);
        }
    }

    // Always draw the original image on top (for hover it overlays gold; for normal it's the only layer)
    AlphaBlend(dc, x, y, sz, sz, ic, 0, 0, bm.bmWidth, bm.bmHeight, bf);

    SelectObject(ic, ob); DeleteDC(ic);
}

// ?????? Load any image file (PNG/JPEG/BMP/GIF/TIFF) via WIC into an HBITMAP ??????
static HBITMAP LoadImageFile(const char *path)
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

    // Pre-multiply alpha for AlphaBlend(AC_SRC_ALPHA)
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

static void LoadBitmaps(void)
{
    ClearBitmaps();
    for (int p = 0; p < MAX_PAGES; p++)
        for (int i = 0; i < g_itemCount; i++) {
            if (g_imgNorm[g_menuType][p][i][0])
                g_bitmaps[g_menuType][p][i][0] = LoadImageFile(g_imgNorm[g_menuType][p][i]);
        }
}

static void FreeBrushes(void)
{
    for (int i = 0; i < MAX_ITEMS; i++)
        if (g_brushes[i]) { DeleteObject(g_brushes[i]); g_brushes[i] = NULL; }
}

static void InitBrushes(void)
{
    FreeBrushes();
    for (int i = 0; i < g_itemCount; i++)
        g_brushes[i] = CreateSolidBrush(g_palette[i]);
}

static void InitLayout(void)
{
    g_hover = -1; g_layoutInit = true;
    double step = 2.0 * M_PI / g_itemCount;
    for (int i = 0; i < g_itemCount; i++) {
        g_sectorCenter[i] = i * step - M_PI / 2.0;
        g_sectorStart[i] = g_sectorCenter[i] - step / 2.0;
        g_sectorEnd[i]   = g_sectorCenter[i] + step / 2.0;
    }
}

static int HitTestSector(int mx, int my)
{
    int ct = WIN_SIZE_BASE * g_menuScale / 100 / 2;
    int so = SO_BASE * g_menuScale / 100;
    int dz = DZ_BASE * g_menuScale / 100;
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

// ?????? Apply effect ????????????????????????????????????????????????????????????????????????????????????????????
static void ApplyEffect(const char *matchName)
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

// ?????? Apply pending for any menu type ??????????????????????????????????????????????????????
static void ApplyPending(void)
{
    if (g_pendingItem < 0) return;
    int idx = g_pendingItem; g_pendingItem = -1;
    if (idx < g_itemCount && g_effects[g_menuType][g_curPage][idx][0])
        ApplyEffect(g_effects[g_menuType][g_curPage][idx]);
}

// ?????? Timer / Dismiss ????????????????????????????????????????????????????????????????????????????????????
static void CancelTimer(void)
{
    if (g_timerId && g_hwnd) { KillTimer(g_hwnd, TIMEOUT_TID); g_timerId = 0; }
}

static void ResetTimer(void)
{
    CancelTimer();
    if (g_hwnd) { g_timerId = (UINT_PTR)SetTimer(g_hwnd, TIMEOUT_TID, TIMEOUT_MS, NULL); }
}

static void HideMenu(void)
{
    CancelTimer();
    HWND h = g_hwnd; g_hwnd = NULL; g_hover = -1;
    if (h) { ReleaseCapture(); DestroyWindow(h); }
}

// ?????? Page navigation ????????????????????????????????????????????????????????????????????????????????????
static void GotoPage(int p)
{
    if (p < 0 || p >= g_totalPages || p == g_curPage) return;
    g_curPage = p;
    g_hover = -1; g_layoutInit = false;
    InvalidateRect(g_hwnd, NULL, TRUE);
    ResetTimer();
}

// ?????? Apply effect after hide ????????????????????????????????????????????????????????????????????
static void SelectItem(int idx)
{
    if (idx < 0 || idx >= g_itemCount) return;
    g_pendingItem = idx;
    HideMenu();
}

// ?????? Draw helpers ??????????????????????????????????????????????????????????????????????????????????????????
// ---- PIE DRAW ----
static void DrawPie(HDC hdc)
{
    if (!g_layoutInit) InitLayout();
    int ws = WIN_SIZE_BASE * g_menuScale / 100;
    int ct = ws / 2;
    int so = SO_BASE * g_menuScale / 100;
    int dz = DZ_BASE * g_menuScale / 100;
    int rr = RR_BASE * g_menuScale / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SetBkMode(dc, TRANSPARENT);
    HPEN np = CreatePen(PS_NULL, 0, 0);

    // Sector fills with bgAlpha onto temp DC then composite
    HBRUSH secBr = CreateSolidBrush(g_bgColor);
    int hr = min(255, GetRValue(g_bgColor) + 18);
    int hg = min(255, GetGValue(g_bgColor) + 18);
    int hb = min(255, GetBValue(g_bgColor) + 18);
    HBRUSH hovBr = CreateSolidBrush(RGB(hr, hg, hb));

    HDC sdc = CreateCompatibleDC(dc);
    HBITMAP sbmp = CreateCompatibleBitmap(dc, ws, ws);
    HBITMAP sob = (HBITMAP)SelectObject(sdc, sbmp);
    FillRect(sdc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SelectObject(sdc, np);
    for (int i = 0; i < g_itemCount; i++) {
        int sx = ct + (int)(so * cos(g_sectorStart[i]));
        int sy = ct + (int)(so * sin(g_sectorStart[i]));
        int ex = ct + (int)(so * cos(g_sectorEnd[i]));
        int ey = ct + (int)(so * sin(g_sectorEnd[i]));
        SelectObject(sdc, (i == g_hover) ? hovBr : secBr);
        Pie(sdc, ct - so, ct - so, ct + so, ct + so, sx, sy, ex, ey);
        if (i == g_hover) {
            HPEN hp = CreatePen(PS_SOLID, 2, RGB(255, 255, 255));
            SelectObject(sdc, hp); SelectObject(sdc, GetStockObject(HOLLOW_BRUSH));
            Pie(sdc, ct - so, ct - so, ct + so, ct + so, sx, sy, ex, ey);
            DeleteObject(hp);
        }
    }
    SelectObject(sdc, np); SelectObject(sdc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    Ellipse(sdc, ct - dz, ct - dz, ct + dz, ct + dz);
    BLENDFUNCTION sbf = {AC_SRC_OVER, 0, (BYTE)(g_bgAlpha * 255 / 100), 0};
    AlphaBlend(dc, 0, 0, ws, ws, sdc, 0, 0, ws, ws, sbf);
    SelectObject(sdc, sob); DeleteDC(sdc); DeleteObject(sbmp);
    DeleteObject(secBr); DeleteObject(hovBr);

    // Divider lines
    HPEN dp = CreatePen(PS_SOLID, 1, RGB(60,60,65));
    SelectObject(dc, dp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    for (int i = 0; i < g_itemCount; i++) {
        int x1 = ct + (int)(dz * cos(g_sectorStart[i]));
        int y1 = ct + (int)(dz * sin(g_sectorStart[i]));
        int x2 = ct + (int)(so * cos(g_sectorStart[i]));
        int y2 = ct + (int)(so * sin(g_sectorStart[i]));
        MoveToEx(dc, x1, y1, NULL); LineTo(dc, x2, y2);
    }
    DeleteObject(dp);

    // Images
    bool anyBmp = false;
    for (int i = 0; i < 9; i++) if (g_bitmaps[g_menuType][g_curPage][i][0]) { anyBmp = true; break; }
    if (anyBmp) {
        for (int i = 0; i < g_itemCount; i++) {
            int sx = ct + (int)(so * cos(g_sectorStart[i]));
            int sy = ct + (int)(so * sin(g_sectorStart[i]));
            int ex = ct + (int)(so * cos(g_sectorEnd[i]));
            int ey = ct + (int)(so * sin(g_sectorEnd[i]));
            HRGN sec = CreateEllipticRgn(ct - so, ct - so, ct + so, ct + so);
            HRGN dzr = CreateEllipticRgn(ct - dz, ct - dz, ct + dz, ct + dz);
            CombineRgn(sec, sec, dzr, RGN_DIFF);
            POINT pts[3] = {{ct, ct}, {sx, sy}, {ex, ey}};
            HRGN tri = CreatePolygonRgn(pts, 3, WINDING);
            CombineRgn(sec, sec, tri, RGN_AND);
            DeleteObject(tri); DeleteObject(dzr);
            SelectClipRgn(dc, sec); DrawImageSector(dc, i); SelectClipRgn(dc, NULL); DeleteObject(sec);
        }
    }

    // Text
    int fntSz = 15 * g_menuScale / 100 * (g_textSize + 50) / 100;
    if (fntSz < 8) fntSz = 8;
    HFONT font = CreateFontA(fntSz, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);
    for (int i = 0; i < g_itemCount; i++) {
        double a = g_sectorCenter[i];
        int tr = dz + (so - dz) * g_textDist / 100;
        int tx = ct + (int)(tr * cos(a)), ty = ct + (int)(tr * sin(a));
        SetTextColor(dc, (i == g_hover) ? RGB(255,255,255) : RGB(140,140,145));
        SetTextAlign(dc, TA_CENTER | TA_TOP);
        TextOutA(dc, tx, ty - fntSz/2 - 2, g_names[g_menuType][g_curPage][i], (int)strlen(g_names[g_menuType][g_curPage][i]));
    }
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, RGB(120,120,125)); SetTextAlign(dc, TA_CENTER | TA_TOP);
    TextOutA(dc, ct, ct + 10, pageBuf, (int)strlen(pageBuf));

    // Ring + arc
    SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    HPEN rp = CreatePen(PS_SOLID, RING_STROKE, RGB(55,55,60));
    SelectObject(dc, rp);
    Ellipse(dc, ct - rr, ct - rr, ct + rr, ct + rr); DeleteObject(rp);

    LOGBRUSH lb = { BS_SOLID, RGB(200,200,205), 0 };
    HPEN ap = ExtCreatePen(PS_GEOMETRIC | PS_SOLID | PS_ENDCAP_ROUND, ARC_STROKE, &lb, 0, NULL);
    SelectObject(dc, ap);
    double as = g_arcAngleDeg - 360.0 / g_itemCount / 2.0;
    int asx = ct + (int)(rr * cos(as * M_PI / 180.0)), asy = ct + (int)(rr * sin(as * M_PI / 180.0));
    int aex = ct + (int)(rr * cos((as + 360.0 / g_itemCount) * M_PI / 180.0)), aey = ct + (int)(rr * sin((as + 360.0 / g_itemCount) * M_PI / 180.0));
    Arc(dc, ct - rr, ct - rr, ct + rr, ct + rr, aex, aey, asx, asy); DeleteObject(ap);

    SelectObject(dc, of); DeleteObject(font); DeleteObject(np);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

// ?????? // ?????? QUICK DRAW ??????????????????????????????????????????????????????????????????????????????????????????????
static void DrawQuick(HDC hdc)
{
    int ws = WIN_SIZE_BASE * g_menuScale / 100;
    int qw = QW_BASE * g_menuScale / 100;
    int qh = QH_BASE * g_menuScale / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SetBkMode(dc, TRANSPARENT);

    int totalH = g_itemCount * qh + (g_itemCount - 1) * QUICK_GAP;
    int startY = (ws - totalH) / 2;

    HFONT font = CreateFontA(15, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    for (int i = 0; i < g_itemCount; i++) {
        int y = startY + i * (qh + QUICK_GAP);
        int x = (ws - qw) / 2;
        RECT r = {x, y, x + qw, y + qh};
        HBRUSH br = CreateSolidBrush((i == g_hover) ? RGB(60,60,65) : g_palette[i % 9]);
        FillRect(dc, &r, br); DeleteObject(br);
        HPEN bp = CreatePen(PS_SOLID, 1, (i == g_hover) ? RGB(255,255,255) : RGB(80,80,85));
        SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
        Rectangle(dc, x, y, x + qw, y + qh); DeleteObject(bp);

        SetTextColor(dc, RGB(220,220,225));
        SetTextAlign(dc, TA_LEFT | TA_TOP);
        TextOutA(dc, x + 8, y + 8, g_names[g_menuType][g_curPage][i], (int)strlen(g_names[g_menuType][g_curPage][i]));
    }
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, RGB(120,120,125)); SetTextAlign(dc, TA_CENTER | TA_TOP);
    TextOutA(dc, ws/2, startY + totalH + 12, pageBuf, (int)strlen(pageBuf));

    SelectObject(dc, of); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

static int HitTestQuick(int mx, int my)
{
    int ws = WIN_SIZE_BASE * g_menuScale / 100;
    int qw = QW_BASE * g_menuScale / 100;
    int qh = QH_BASE * g_menuScale / 100;
    int totalH = g_itemCount * qh + (g_itemCount - 1) * QUICK_GAP;
    int startY = (ws - totalH) / 2;
    int x0 = (ws - qw) / 2;
    if (mx < x0 || mx > x0 + qw) return -1;
    for (int i = 0; i < g_itemCount; i++) {
        int y = startY + i * (qh + QUICK_GAP);
        if (my >= y && my <= y + qh) return i;
    }
    return -1;
}
// ?????? WHEEL DRAW ??????????????????????????????????????????????????????????????????????????????????????????????
static int g_wheelSlots[4]; // top idx0, bottom idx1, left idx2, right idx3

static void DrawWheel(HDC hdc)
{
    int ws = WIN_SIZE_BASE * g_menuScale / 100;
    int ct = ws / 2;
    int wa = WA_BASE * g_menuScale / 100;
    int wbw = WH_BASE * g_menuScale / 100;
    int wbh = WH_BASE * g_menuScale / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SetBkMode(dc, TRANSPARENT);

    HFONT font = CreateFontA(15, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    struct { int cx, cy; int x, y; } arms[4] = {
        {ct, ct - wa, ct - wbw/2, ct - wa - wbh/2},
        {ct, ct + wa, ct - wbw/2, ct + wa - wbh/2},
        {ct - wa, ct, ct - wa - wbh/2, ct - wbw/2},
        {ct + wa, ct, ct + wa - wbh/2, ct - wbw/2}
    };

    g_wheelSlots[0] = g_hover == 0 ? 0 : (g_hover == 1 ? 1 : -1);
    g_wheelSlots[1] = g_hover == 2 ? 0 : (g_hover == 3 ? 1 : -1);
    g_wheelSlots[2] = g_hover == 4 ? 0 : (g_hover == 5 ? 1 : -1);
    g_wheelSlots[3] = g_hover == 6 ? 0 : (g_hover == 7 ? 1 : -1);

    int slotIdx = 0;
    for (int a = 0; a < 4; a++) {
        for (int side = 0; side < 2; side++, slotIdx++) {
            bool hover = (g_hover == slotIdx);
            int bw = wbw, bh = wbh;
            int bx, by;
            if (a < 2) {
                bx = arms[a].x;
                by = arms[a].y + (side == 0 ? -bh - WHEEL_GAP : 0);
            } else {
                bx = arms[a].x + (side == 0 ? -bw - WHEEL_GAP : 0);
                by = arms[a].y;
            }
            RECT r = {bx, by, bx + bw, by + bh};
            HBRUSH br = CreateSolidBrush(hover ? RGB(60,60,65) : RGB(40,40,45));
            FillRect(dc, &r, br); DeleteObject(br);
            HPEN bp = CreatePen(PS_SOLID, 1, hover ? RGB(255,255,255) : RGB(70,70,75));
            SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
            Rectangle(dc, bx, by, bx + bw, by + bh); DeleteObject(bp);

            int nameIdx = a * 2 + side;
            if (g_names[g_menuType][g_curPage][nameIdx][0]) {
                SetTextColor(dc, hover ? RGB(255,255,255) : RGB(180,180,185));
                RECT tr = {bx + 4, by + 2, bx + bw - 4, by + bh - 2};
                DrawTextA(dc, g_names[g_menuType][g_curPage][nameIdx], -1, &tr, DT_CENTER | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX);
            }
        }
    }

    // Center circle
    HPEN cp = CreatePen(PS_SOLID, 3, RGB(100,100,105));
    SelectObject(dc, cp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    Ellipse(dc, ct - 15, ct - 15, ct + 15, ct + 15);
    DeleteObject(cp);

    SetTextColor(dc, RGB(150,150,155));
    SetTextAlign(dc, TA_CENTER | TA_TOP);
    char buf[16]; _snprintf_s(buf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    TextOutA(dc, ct, ct + 20, buf, (int)strlen(buf));

    SelectObject(dc, of); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

static int HitTestWheel(int mx, int my)
{
    int ct = WIN_SIZE_BASE * g_menuScale / 100 / 2;
    int wa = WA_BASE * g_menuScale / 100;
    int wbw = WH_BASE * g_menuScale / 100;
    int wbh = WH_BASE * g_menuScale / 100;
    struct { int cx, cy; int x, y; } arms[4] = {
        {ct, ct - wa, ct - wbw/2, ct - wa - wbh},
        {ct, ct + wa, ct - wbw/2, ct + wa},
        {ct - wa, ct, ct - wa - wbh, ct - wbw/2},
        {ct + wa, ct, ct + wa, ct - wbw/2}
    };
    int slot = 0;
    for (int a = 0; a < 4; a++) {
        for (int side = 0; side < 2; side++, slot++) {
            int bw = wbw, bh = wbh;
            int bx, by;
            if (a < 2) {
                bx = arms[a].x; by = arms[a].y + (side == 0 ? -bh - WHEEL_GAP : 0);
            } else {
                bx = arms[a].x + (side == 0 ? -bw - WHEEL_GAP : 0); by = arms[a].y;
            }
            if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) return slot;
        }
    }
    return -1;
}
// ?????? Show menu ????????????????????????????????????????????????????????????????????????????????????????????????
static void ShowMenu(void)
{
    if (g_hwnd) return;
    CoInitialize(NULL);
    LoadSettings();
    int ws = WIN_SIZE_BASE * g_menuScale / 100;
    int ct = ws / 2;
    switch (g_menuType) {
        case MENU_PIE:   g_itemCount = g_pieCount; break;
        case MENU_QUICK: g_itemCount = g_quickCount; break;
        case MENU_WHEEL: g_itemCount = 8; break;
    }
    InitBrushes(); LoadBitmaps();

    WNDCLASS wc = {0}; wc.hInstance = GetModuleHandle(NULL); wc.hCursor = LoadCursor(NULL, IDC_ARROW);

    const char *cls = NULL;
    switch (g_menuType) {
        case MENU_PIE:   cls = "WB_PieClass"; break;
        case MENU_QUICK: cls = "WB_QuickClass"; break;
        case MENU_WHEEL: cls = "WB_WheelClass"; break;
    }
    if (!g_class_registered[g_menuType]) {
        wc.lpfnWndProc = [](HWND h, UINT m, WPARAM w, LPARAM l) -> LRESULT {
            switch (m) {
                case WM_PAINT: { PAINTSTRUCT ps; HDC dc = BeginPaint(h, &ps);
                    if (g_menuType == MENU_PIE) DrawPie(dc);
                    else if (g_menuType == MENU_QUICK) DrawQuick(dc);
                    else DrawWheel(dc);
                    EndPaint(h, &ps); return 0; }
                case WM_ERASEBKGND: return 1;
                case WM_MOUSEMOVE: {
                    int x = GET_X_LPARAM(l), y = GET_Y_LPARAM(l);
                    int hov = -1;
                    if (g_menuType == MENU_PIE) hov = HitTestSector(x, y);
                    else if (g_menuType == MENU_QUICK) hov = HitTestQuick(x, y);
                    else hov = HitTestWheel(x, y);
                    if (hov != g_hover) { g_hover = hov; InvalidateRect(h, NULL, FALSE); }
                    if (g_menuType == MENU_PIE) {
                        double dx = (double)(x - (WIN_SIZE_BASE * g_menuScale / 100 / 2)), dy = (double)(y - (WIN_SIZE_BASE * g_menuScale / 100 / 2));
                        if (sqrt(dx*dx+dy*dy) > 2.0) g_arcAngleDeg = atan2(dy,dx)*180.0/M_PI;
                    }
                    TRACKMOUSEEVENT tme = {sizeof(tme), TME_LEAVE, h, 0};
                    TrackMouseEvent(&tme); return 0; }
                case WM_MOUSELEAVE: { if (g_hover != -1) { g_hover = -1; InvalidateRect(h, NULL, FALSE); } break; }
                case WM_LBUTTONDOWN: {
                    int x = GET_X_LPARAM(l), y = GET_Y_LPARAM(l);
                    int idx = -1;
                    if (g_menuType == MENU_PIE) idx = HitTestSector(x, y);
                    else if (g_menuType == MENU_QUICK) idx = HitTestQuick(x, y);
                    else idx = HitTestWheel(x, y);
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
                    break;
                }
                case WM_TIMER: if (w == TIMEOUT_TID) { HideMenu(); return 0; }
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
    ResetTimer();
    POINT cur; GetCursorPos(&cur); ScreenToClient(g_hwnd, &cur);
    if (g_menuType == MENU_PIE) {
        double dx = (double)(cur.x - (WIN_SIZE_BASE * g_menuScale / 100 / 2)), dy = (double)(cur.y - (WIN_SIZE_BASE * g_menuScale / 100 / 2));
        if (sqrt(dx*dx+dy*dy) > 2.0) g_arcAngleDeg = atan2(dy,dx)*180.0/M_PI;
        g_hover = HitTestSector((int)cur.x, (int)cur.y);
    } else if (g_menuType == MENU_QUICK) {
        g_hover = HitTestQuick((int)cur.x, (int)cur.y);
    } else {
        g_hover = HitTestWheel((int)cur.x, (int)cur.y);
    }
    InvalidateRect(g_hwnd, NULL, FALSE);
}

// ?????? Raw Input WndProc ????????????????????????????????????????????????????????????????????????????????
static LRESULT CALLBACK RawWndProc(HWND hwnd, UINT msg, WPARAM w, LPARAM l)
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
                    if (g_numpadEnabled && g_numpadHandle) {
                        if (dev == g_numpadHandle) {
                            WORD vk = ri->data.keyboard.VKey;
                            if (vk >= VK_NUMPAD0 && vk <= VK_NUMPAD9) {
                                int idx = vk - VK_NUMPAD0;
                                BOOL up = (ri->data.keyboard.Flags & RI_KEY_BREAK);
                                WORD fKey = VK_F13 + idx;
                                INPUT in[2] = {0};
                                in[0].type = INPUT_KEYBOARD; in[0].ki.wVk = vk; in[0].ki.dwFlags = KEYEVENTF_KEYUP;
                                in[1].type = INPUT_KEYBOARD; in[1].ki.wVk = fKey;
                                if (up) in[1].ki.dwFlags = KEYEVENTF_KEYUP;
                                SendInput(2, in, sizeof(INPUT));
                                free(ri); return 0;
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

static void InitRawWindow(void)
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

// ?????? AEGP Hooks ??????????????????????????????????????????????????????????????????????????????????????????????
static A_Err UpdateMenuHook(AEGP_GlobalRefcon, AEGP_UpdateMenuRefcon, AEGP_WindowType)
{
    AEGP_SuiteHandler suites(sP);
    for (int i = 0; i < 5; i++) suites.CommandSuite1()->AEGP_EnableCommand(S_pi_cmd[i]);
    return A_Err_NONE;
}

static A_Err CommandHook(AEGP_GlobalRefcon, AEGP_CommandRefcon, AEGP_Command cmd, AEGP_HookPriority, A_Boolean, A_Boolean *handledPB)
{
    for (int i = 0; i < 3; i++) if (S_pi_cmd[i] == cmd) {
        *handledPB = TRUE; g_menuType = i; ShowMenu(); return A_Err_NONE;
    }
    if (S_pi_cmd[3] == cmd) { *handledPB = TRUE; DoSaveEff(); return A_Err_NONE; }
    if (S_pi_cmd[4] == cmd) { *handledPB = TRUE; DoApplyEff(); return A_Err_NONE; }
    return A_Err_NONE;
}

static void ClearPendingInFile(void)
{
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "r");
    if (!f) return;
    char lines[64][1024]; int n = 0;
    char buf[1024];
    while (fgets(buf, sizeof(buf), f) && n < 64) {
        strncpy_s(lines[n], 1024, buf, _TRUNCATE);
        n++;
    }
    fclose(f);
    f = NULL; fopen_s(&f, p, "w");
    if (!f) return;
    for (int i = 0; i < n; i++) {
        char k[64] = {0};
        if (sscanf_s(lines[i], " %63[^=]", k, 64) >= 1) {
            if (strcmp(k, "save_eff_pending") == 0) continue;
            if (strcmp(k, "save_eff_path") == 0) continue;
            if (strcmp(k, "apply_eff_pending") == 0) continue;
            if (strcmp(k, "apply_eff_path") == 0) continue;
            if (strcmp(k, "save_eff_result") == 0) continue;
        }
        fputs(lines[i], f);
    }
    fclose(f);
}

static A_Err IdleHook(AEGP_GlobalRefcon, AEGP_IdleRefcon, A_long*)
{
    ApplyPending();
    // Read pending ops and trigger settings from file
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "r");
    if (f) {
        char l[1024];
        int newKey = g_triggerKey, newMod = g_triggerMod;
        bool triggerChanged = false;
        bool triggerDisabled = false;
        while (fgets(l, sizeof(l), f)) {
            char k[64] = {0}, v[960] = {0};
            if (sscanf_s(l, " %63[^=]=%959[^\r\n]", k, 64, v, 960) >= 1) {
                if (strcmp(k, "save_eff_pending") == 0) g_saveEffPending = (atoi(v) != 0);
                else if (strcmp(k, "save_eff_path") == 0) strncpy_s(g_saveEffPath, sizeof(g_saveEffPath), v, _TRUNCATE);
                else if (strcmp(k, "apply_eff_pending") == 0) g_applyEffPending = (atoi(v) != 0);
                else if (strcmp(k, "apply_eff_path") == 0) strncpy_s(g_applyEffPath, sizeof(g_applyEffPath), v, _TRUNCATE);
                else if (strcmp(k, "trigger_disabled") == 0) { triggerDisabled = (atoi(v) != 0); }
                else if (strcmp(k, "trigger_key") == 0) { newKey = atoi(v); triggerChanged = true; }
                else if (strcmp(k, "trigger_mod") == 0) { newMod = atoi(v); triggerChanged = true; }
            }
        }
        fclose(f);
        if (triggerDisabled || (triggerChanged && (newKey == 0 || newMod == 0))) {
            if (g_rawWnd) UnregisterHotKey(g_rawWnd, 0);
            g_triggerKey = 0; g_triggerMod = 0;
        } else if (triggerChanged && newKey && newMod) {
            g_triggerKey = newKey; g_triggerMod = newMod;
            RegisterTriggerHotkey();
        }
    }
    if (g_saveEffPending && g_saveEffPath[0]) {
        g_saveEffPending = false;
        DoSaveEff();
    }
    if (g_applyEffPending && g_applyEffPath[0]) {
        g_applyEffPending = false;
        DoApplyEff();
    }
    ClearPendingInFile();
    return A_Err_NONE;
}

A_Err EntryPointFunc(struct SPBasicSuite *pica_basicP, A_long, A_long, AEGP_PluginID id, AEGP_GlobalRefcon *gr)
{
    CoInitialize(NULL);
    S_id = id; sP = pica_basicP;
    A_Err err = A_Err_NONE;
    AEGP_SuiteHandler suites(pica_basicP);

    const char *labels[5] = {"wb tools pack", "Quick Menu", "Wheel Menu", "Save Eff", "Apply Eff"};
    for (int i = 0; i < 5; i++) {
        ERR(suites.CommandSuite1()->AEGP_GetUniqueCommand(&S_pi_cmd[i]));
        if (S_pi_cmd[i])
            ERR(suites.CommandSuite1()->AEGP_InsertMenuCommand(S_pi_cmd[i], labels[i], (i < 3) ? AEGP_Menu_WINDOW : AEGP_Menu_EDIT, AEGP_MENU_INSERT_SORTED));
    }

    ERR(suites.RegisterSuite5()->AEGP_RegisterCommandHook(S_id, AEGP_HP_BeforeAE, AEGP_Command_ALL, CommandHook, 0));
    ERR(suites.RegisterSuite5()->AEGP_RegisterUpdateMenuHook(S_id, UpdateMenuHook, 0));
    ERR(suites.RegisterSuite5()->AEGP_RegisterIdleHook(S_id, IdleHook, 0));

    LoadSettings();
    InitRawWindow();
    return err;
}





