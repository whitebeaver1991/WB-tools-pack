#include "..\WB_PieMenu.h"

void GetSettingsPath(char *buf, int sz)
{
    char a[MAX_PATH]; GetEnvironmentVariableA("LOCALAPPDATA", a, sizeof(a));
    _snprintf_s(buf, sz, _TRUNCATE, "%s\\WB_PieMenu\\settings.txt", a);
}

void DefaultsForMenu(int m)
{
    for (int p = 0; p < MAX_PAGES; p++)
        for (int i = 0; i < MAX_ITEMS; i++) {
            _snprintf_s(g_names[m][p][i], 64, _TRUNCATE, "Item %d", i + 1);
            g_effects[m][p][i][0] = 0;
            g_imgNorm[m][p][i][0] = 0;
            g_imgHovr[m][p][i][0] = 0;
            g_imgSize[m][p][i] = 80;
        }
    for (int mm = 0; mm < 4; mm++)
        for (int p = 0; p < MAX_PAGES; p++)
            for (int i = 0; i < MAX_ITEMS; i++) {
                g_slotKey[mm][p][i] = 0;
                g_slotMod[mm][p][i] = 0;
                g_slotAction[mm][p][i] = 0;
            }
}

void SetVal(const char *key, const char *val)
{
    int m = -1, p = 0, i = 0;
    char rest[64] = {0};
    if (sscanf_s(key, "pie_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_PIE;
    else if (sscanf_s(key, "quick_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_QUICK;
    else if (sscanf_s(key, "wheel_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_WHEEL;
    else if (sscanf_s(key, "infinite_%d_%d_%63s", &p, &i, rest, 63) >= 3) m = MENU_INFINITE;
    else if (strcmp(key, "menu_type") == 0) { g_menuType = atoi(val); return; }
    else if (strcmp(key, "pie_count") == 0) { int n = atoi(val); if (n >= 2 && n <= 8) g_pieCount = n; return; }
    else if (strcmp(key, "quick_count") == 0) { int n = atoi(val); if (n >= 1 && n <= 9) g_quickCount = n; return; }
    else if (strcmp(key, "wheel_count") == 0) { int n = atoi(val); if (n == 4 || n == 6 || n == 8) g_wheelCount = n; return; }
    else if (strcmp(key, "trigger_key") == 0) { g_triggerKey = atoi(val); return; }
    else if (strcmp(key, "trigger_mod") == 0) { g_triggerMod = atoi(val); return; }
    else if (strcmp(key, "prev_page_key") == 0) { int n = atoi(val); if (n > 0) g_prevPageKey = n; return; }
    else if (strcmp(key, "next_page_key") == 0) { int n = atoi(val); if (n > 0) g_nextPageKey = n; return; }
    else if (strcmp(key, "win_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_winAlpha = n; return; }
    else if (strcmp(key, "pie_bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_bgAlpha[0] = n; return; }
    else if (strcmp(key, "quick_bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_bgAlpha[1] = n; return; }
    else if (strcmp(key, "wheel_bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_bgAlpha[2] = n; return; }
    else if (strcmp(key, "infinite_bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) g_bgAlpha[3] = n; return; }
    else if (strcmp(key, "bg_alpha") == 0) { int n = atoi(val); if (n >= 0 && n <= 100) { for (int z=0;z<4;z++) g_bgAlpha[z] = n; } return; }
    else if (strcmp(key, "pie_bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_bgColor[0] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "quick_bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_bgColor[1] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "wheel_bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_bgColor[2] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "infinite_bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_bgColor[3] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "bg_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; COLORREF v = RGB(cr,cg,cb) & 0xFFFFFF; for (int z=0;z<4;z++) g_bgColor[z] = v; } return; }
    else if (strcmp(key, "pie_glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_glowColor[0] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "quick_glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_glowColor[1] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "wheel_glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_glowColor[2] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "infinite_glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_glowColor[3] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "glow_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; COLORREF v = RGB(cr,cg,cb) & 0xFFFFFF; for (int z=0;z<4;z++) g_glowColor[z] = v; } return; }
    else if (strcmp(key, "pie_glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) g_glowIntensity[0] = n; return; }
    else if (strcmp(key, "quick_glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) g_glowIntensity[1] = n; return; }
    else if (strcmp(key, "wheel_glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) g_glowIntensity[2] = n; return; }
    else if (strcmp(key, "infinite_glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) g_glowIntensity[3] = n; return; }
    else if (strcmp(key, "glow_intensity") == 0) { int n = atoi(val); if (n >= 0 && n <= 200) { for (int z=0;z<4;z++) g_glowIntensity[z] = n; } return; }
    else if (strcmp(key, "pie_page_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_pageColor[0] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "quick_page_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_pageColor[1] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "wheel_page_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_pageColor[2] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "infinite_page_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; g_pageColor[3] = RGB(cr,cg,cb) & 0xFFFFFF; } return; }
    else if (strcmp(key, "page_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { int cr=(c>>16)&0xFF,cg=(c>>8)&0xFF,cb=c&0xFF; COLORREF v = RGB(cr,cg,cb) & 0xFFFFFF; for (int z=0;z<4;z++) g_pageColor[z] = v; } return; }
    else if (strcmp(key, "settings_version") == 0) { g_settingsVersion = atoi(val); return; }
    else if (strcmp(key, "pie_img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) g_imgDist[0] = n; return; }
    else if (strcmp(key, "quick_img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) g_imgDist[1] = n; return; }
    else if (strcmp(key, "wheel_img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) g_imgDist[2] = n; return; }
    else if (strcmp(key, "infinite_img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) g_imgDist[3] = n; return; }
    else if (strcmp(key, "img_dist") == 0) { int n = atoi(val); if (n >= 20 && n <= 80) { for (int z=0;z<4;z++) g_imgDist[z] = n; } return; }
    else if (strcmp(key, "pie_text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) g_textDist[0] = n; return; }
    else if (strcmp(key, "quick_text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) g_textDist[1] = n; return; }
    else if (strcmp(key, "wheel_text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) g_textDist[2] = n; return; }
    else if (strcmp(key, "infinite_text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) g_textDist[3] = n; return; }
    else if (strcmp(key, "text_dist") == 0) { int n = atoi(val); if (n >= 30 && n <= 90) { for (int z=0;z<4;z++) g_textDist[z] = n; } return; }
    else if (strcmp(key, "pie_text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_textSize[0] = n; return; }
    else if (strcmp(key, "quick_text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_textSize[1] = n; return; }
    else if (strcmp(key, "wheel_text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_textSize[2] = n; return; }
    else if (strcmp(key, "infinite_text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_textSize[3] = n; return; }
    else if (strcmp(key, "text_size") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) { for (int z=0;z<4;z++) g_textSize[z] = n; } return; }
    else if (strcmp(key, "pie_menu_scale") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_menuScale[0] = n; return; }
    else if (strcmp(key, "quick_menu_scale") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_menuScale[1] = n; return; }
    else if (strcmp(key, "wheel_menu_scale") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_menuScale[2] = n; return; }
    else if (strcmp(key, "infinite_menu_scale") == 0) { int n = atoi(val); if (n >= 50 && n <= 150) g_menuScale[3] = n; return; }
    else if (strcmp(key, "menu_scale") == 0) { return; }
    else if (strcmp(key, "numpad_enabled") == 0) { g_numpadEnabled = (atoi(val) != 0); return; }
    else if (strcmp(key, "numpad_enter_action") == 0) { int n = atoi(val); if (n >= 0 && n <= 4) g_numpadEnterAction = n; return; }
    else if (strcmp(key, "select_mode") == 0) { g_selectMode = (atoi(val) != 0) ? 1 : 0; return; }
    else if (strcmp(key, "guide_enabled") == 0) { g_guideEnabled = (atoi(val) != 0); return; }
    else if (strcmp(key, "guide_color") == 0) { unsigned int c; if (sscanf_s(val, "%x", &c) >= 1) { g_guideColor = RGB((c>>16)&0xFF,(c>>8)&0xFF,c&0xFF) & 0xFFFFFF; } return; }
    else if (strcmp(key, "guide_width") == 0) { int n = atoi(val); if (n >= 1 && n <= 6) g_guideWidth = n; return; }
    else if (strcmp(key, "numpad_handle") == 0) { g_numpadHandle = (HANDLE)(INT_PTR)_strtoui64(val, NULL, 16); return; }
    else if (strcmp(key, "numpad_name") == 0) { strncpy_s(g_numpadName, sizeof(g_numpadName), val, _TRUNCATE); return; }
    else if (strcmp(key, "numpad_device_path") == 0) { strncpy_s(g_numpadDevicePath, sizeof(g_numpadDevicePath), val, _TRUNCATE); return; }
    else if (strcmp(key, "item_count") == 0) { int n = atoi(val); if (n >= 2 && n <= 8) g_pieCount = n; return; }
    else if (strcmp(key, "save_eff_path") == 0) { strncpy_s(g_saveEffPath, sizeof(g_saveEffPath), val, _TRUNCATE); return; }
    else if (strcmp(key, "apply_eff_path") == 0) { strncpy_s(g_applyEffPath, sizeof(g_applyEffPath), val, _TRUNCATE); return; }
    else if (strcmp(key, "save_eff_pending") == 0) { g_saveEffPending = (atoi(val) != 0); return; }
    else if (strcmp(key, "apply_eff_pending") == 0) { g_applyEffPending = (atoi(val) != 0); return; }
    else if (strcmp(key, "infinite_sectors") == 0) { int n = atoi(val); if (n >= 2 && n <= 8) g_infiniteSectors = n; return; }
    else if (strcmp(key, "infinite_split_R2") == 0) { if (strcmp(val, "nosplit") == 0) g_infiniteSplitR2 = -1; else g_infiniteSplitR2 = (strcmp(val, "2r") == 0) ? 1 : 0; return; }
    else if (strcmp(key, "infinite_split_R3") == 0) { if (strcmp(val, "nosplit") == 0) { g_infiniteSplitR3 = 1; return; } int n = atoi(val); if (n == 2 || n == 3) g_infiniteSplitR3 = n; return; }
    else if (strcmp(key, "infinite_rDead") == 0) { int n = atoi(val); if (n >= 6 && n <= 45) g_infiniteRDead = n; return; }
    else if (strcmp(key, "infinite_r1") == 0) { int n = atoi(val); if (n >= 30 && n <= 130) g_infiniteR1 = n; return; }
    else if (strcmp(key, "infinite_r2") == 0) { int n = atoi(val); if (n >= 60 && n <= 165) g_infiniteR2 = n; return; }
    else if (strncmp(key, "infinite_sector_", 16) == 0) {
        int si = 0;
        if (sscanf_s(key + 16, "%d_color", &si) >= 1 && si >= 0 && si < 8) {
            unsigned int c;
            if (sscanf_s(val, "%x", &c) >= 1) {
                int cr = (c >> 16) & 0xFF, cg = (c >> 8) & 0xFF, cb = c & 0xFF;
                g_infiniteSectorColors[si] = RGB(cr, cg, cb);
            }
        }
        return;
    }
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
    else if (strcmp(rest, "key") == 0) { g_slotKey[m][p][i] = atoi(val); }
    else if (strcmp(rest, "mod") == 0) { g_slotMod[m][p][i] = atoi(val); }
    else if (strcmp(rest, "act") == 0) { int n = atoi(val); if (n >= 0 && n <= 3) g_slotAction[m][p][i] = n; }
}

void LoadSettings(void)
{
    for (int m = 0; m < 4; m++) DefaultsForMenu(m);
    g_menuType = MENU_PIE; g_itemCount = 4;
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

void WriteSection(FILE *f, const char *prefix, int pages, int count)
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
            if (g_slotKey[m][p][i]) fprintf(f, "%s_%d_%d_key=%d\n", prefix, p, i, g_slotKey[m][p][i]);
            if (g_slotMod[m][p][i]) fprintf(f, "%s_%d_%d_mod=%d\n", prefix, p, i, g_slotMod[m][p][i]);
            if (g_slotAction[m][p][i]) fprintf(f, "%s_%d_%d_act=%d\n", prefix, p, i, g_slotAction[m][p][i]);
        }
    }
}

void WriteInfiniteSection(FILE *f)
{
    fprintf(f, "infinite_sectors=%d\n", g_infiniteSectors);
    fprintf(f, "infinite_split_R2=%s\n", g_infiniteSplitR2 < 0 ? "nosplit" : (g_infiniteSplitR2 ? "2r" : "2a"));
    fprintf(f, "infinite_split_R3=%s\n", g_infiniteSplitR3 < 2 ? "nosplit" : (g_infiniteSplitR3 == 2 ? "2" : "3"));
    fprintf(f, "infinite_rDead=%d\n", g_infiniteRDead);
    fprintf(f, "infinite_r1=%d\n", g_infiniteR1);
    fprintf(f, "infinite_r2=%d\n", g_infiniteR2);
    for (int si = 0; si < 8; si++) {
        COLORREF c = g_infiniteSectorColors[si];
        fprintf(f, "infinite_sector_%d_color=%02x%02x%02x\n", si, GetRValue(c), GetGValue(c), GetBValue(c));
    }
    int r2s = (g_infiniteSplitR2 < 0) ? 1 : 2;
    int r3s = (g_infiniteSplitR3 < 2) ? 1 : g_infiniteSplitR3;
    int count = g_infiniteSectors * (1 + r2s + r3s);
    for (int i = 0; i < count && i < MAX_ITEMS; i++) {
        if (g_names[MENU_INFINITE][0][i][0])
            fprintf(f, "infinite_0_%d_n=%s\n", i, g_names[MENU_INFINITE][0][i]);
        if (g_effects[MENU_INFINITE][0][i][0])
            fprintf(f, "infinite_0_%d_e=%s\n", i, g_effects[MENU_INFINITE][0][i]);
        if (g_imgNorm[MENU_INFINITE][0][i][0])
            fprintf(f, "infinite_0_%d_img=%s\n", i, g_imgNorm[MENU_INFINITE][0][i]);
        if (g_imgSize[MENU_INFINITE][0][i] != 80)
            fprintf(f, "infinite_0_%d_sz=%d\n", i, g_imgSize[MENU_INFINITE][0][i]);
        if (g_slotKey[MENU_INFINITE][0][i])
            fprintf(f, "infinite_0_%d_key=%d\n", i, g_slotKey[MENU_INFINITE][0][i]);
        if (g_slotAction[MENU_INFINITE][0][i])
            fprintf(f, "infinite_0_%d_act=%d\n", i, g_slotAction[MENU_INFINITE][0][i]);
    }
}

void RegisterTriggerHotkey(void)
{
    if (g_rawWnd) {
        UnregisterHotKey(g_rawWnd, 0);
        if (g_triggerKey && g_triggerMod)
            RegisterHotKey(g_rawWnd, 0, g_triggerMod, g_triggerKey);
    }
}

void ClearPendingInFile(void)
{
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "r");
    if (!f) return;
    char lines[256][1024]; int n = 0, skipped = 0;
    char buf[1024];
    while (fgets(buf, sizeof(buf), f) && n < 256) {
        strncpy_s(lines[n], 1024, buf, _TRUNCATE);
        char k[64] = {0};
        if (sscanf_s(lines[n], " %63[^=]", k, 64) >= 1) {
            if (strcmp(k, "save_eff_pending") == 0 ||
                strcmp(k, "save_eff_path") == 0 ||
                strcmp(k, "apply_eff_pending") == 0 ||
                strcmp(k, "apply_eff_path") == 0 ||
                strcmp(k, "save_eff_result") == 0) { skipped++; continue; }
        }
        n++;
    }
    fclose(f);
    if (!skipped) return;
    f = NULL; fopen_s(&f, p, "w");
    if (!f) return;
    for (int i = 0; i < n; i++) fputs(lines[i], f);
    fclose(f);
}
