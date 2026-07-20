#include "WB_PieMenu.h"

A_Err UpdateMenuHook(AEGP_GlobalRefcon, AEGP_UpdateMenuRefcon, AEGP_WindowType)
{
    AEGP_SuiteHandler suites(sP);
    for (int i = 0; i < 8; i++) suites.CommandSuite1()->AEGP_EnableCommand(S_pi_cmd[i]);
    return A_Err_NONE;
}

A_Err CommandHook(AEGP_GlobalRefcon, AEGP_CommandRefcon, AEGP_Command cmd, AEGP_HookPriority, A_Boolean, A_Boolean *handledPB)
{
    for (int i = 0; i < 3; i++) if (S_pi_cmd[i] == cmd) {
        *handledPB = TRUE; g_menuType = i; ShowMenu(); return A_Err_NONE;
    }
    if (S_pi_cmd[3] == cmd) { *handledPB = TRUE; DoSaveEff(); return A_Err_NONE; }
    if (S_pi_cmd[4] == cmd) { *handledPB = TRUE; DoApplyEff(); return A_Err_NONE; }
    if (S_pi_cmd[5] == cmd) { *handledPB = TRUE; ListNumpadDevices(); return A_Err_NONE; }
    if (S_pi_cmd[6] == cmd) { *handledPB = TRUE; ShowMenu(); return A_Err_NONE; }
    if (S_pi_cmd[7] == cmd) {
        *handledPB = TRUE;
        g_numpadHandle = NULL;
        g_numpadDevicePath[0] = 0;
        g_numpadPairing = true;
        // Clear old path from settings file
        char fp[MAX_PATH]; GetSettingsPath(fp, sizeof(fp));
        FILE *tf = NULL; fopen_s(&tf, fp, "r");
        char tlines[256][1024]; int tn = 0;
        if (tf) {
            char tb[1024];
            while (fgets(tb, sizeof(tb), tf) && tn < 256) {
                char tk[64] = {0};
                if (sscanf_s(tb, " %63[^=]", tk, 64) >= 1 && (strcmp(tk, "numpad_device_path") == 0 || strcmp(tk, "numpad_pairing") == 0))
                    { _snprintf_s(tlines[tn], 1024, _TRUNCATE, "numpad_device_path=\nnumpad_pairing=1\n"); tn++; tn++; }
                else { strncpy_s(tlines[tn], 1024, tb, _TRUNCATE); tn++; }
            }
            fclose(tf);
            tf = NULL; fopen_s(&tf, fp, "w");
            if (tf) { for (int ti = 0; ti < tn; ti++) fputs(tlines[ti], tf); fclose(tf); }
        }
        MessageBoxA(NULL, "Pairing mode: press any number key on your external numpad to pair it.", "PieMenu", MB_OK | MB_ICONINFORMATION);
        return A_Err_NONE;
    }
    return A_Err_NONE;
}

A_Err IdleHook(AEGP_GlobalRefcon, AEGP_IdleRefcon, A_long*)
{
    ApplyPending();
    bool needReload = false;
    char p[MAX_PATH]; GetSettingsPath(p, sizeof(p));
    FILE *f = NULL; fopen_s(&f, p, "r");
    if (f) {
        char l[1024];
        int newKey = g_triggerKey, newMod = g_triggerMod;
        bool triggerChanged = false;
        bool triggerDisabled = false;
        bool hasPendingEff = false;
        int fileVersion = -1;
        bool pairingPending = false;
        while (fgets(l, sizeof(l), f)) {
            char k[64] = {0}, v[960] = {0};
            if (sscanf_s(l, " %63[^=]=%959[^\r\n]", k, 64, v, 960) >= 1) {
                if (strcmp(k, "settings_version") == 0) { fileVersion = atoi(v); }
                else if (strcmp(k, "save_eff_pending") == 0) { g_saveEffPending = (atoi(v) != 0); hasPendingEff = true; }
                else if (strcmp(k, "save_eff_path") == 0) strncpy_s(g_saveEffPath, sizeof(g_saveEffPath), v, _TRUNCATE);
                else if (strcmp(k, "apply_eff_pending") == 0) { g_applyEffPending = (atoi(v) != 0); hasPendingEff = true; }
                else if (strcmp(k, "apply_eff_path") == 0) strncpy_s(g_applyEffPath, sizeof(g_applyEffPath), v, _TRUNCATE);
                else if (strcmp(k, "trigger_disabled") == 0) { triggerDisabled = (atoi(v) != 0); }
                else if (strcmp(k, "trigger_key") == 0) { newKey = atoi(v); triggerChanged = true; }
                else if (strcmp(k, "trigger_mod") == 0) { newMod = atoi(v); triggerChanged = true; }
                else if (strcmp(k, "dump_effects") == 0) { g_dumpEffectsPending = (atoi(v) != 0); }
                else if (strcmp(k, "numpad_pairing") == 0 && atoi(v) != 0) { pairingPending = true; }
            }
        }
        fclose(f);
        if (fileVersion > 0 && fileVersion != g_settingsVersion) {
            needReload = true;
        } else {
            if (triggerDisabled || (triggerChanged && (newKey == 0 || newMod == 0))) {
                if (g_rawWnd) UnregisterHotKey(g_rawWnd, 0);
                g_triggerKey = 0; g_triggerMod = 0;
            } else if (triggerChanged && newKey && newMod) {
                g_triggerKey = newKey; g_triggerMod = newMod;
                RegisterTriggerHotkey();
            }
            if (hasPendingEff) ClearPendingInFile();
        }
        // Handle pairing request from settings file
        if (pairingPending) {
            g_numpadHandle = NULL;
            g_numpadDevicePath[0] = 0;
            g_numpadPairing = true;
            pairingPending = false;
            char p2[MAX_PATH]; GetSettingsPath(p2, sizeof(p2));
            FILE *sf = NULL; fopen_s(&sf, p2, "r");
            char lines[256][1024]; int n = 0;
            if (sf) {
                char buf[1024];
                while (fgets(buf, sizeof(buf), sf) && n < 256) {
                    char k[64] = {0};
                    if (sscanf_s(buf, " %63[^=]", k, 64) >= 1) {
                        if (strcmp(k, "numpad_pairing") == 0) {
                            _snprintf_s(lines[n], 1024, _TRUNCATE, "numpad_pairing=0\n");
                        } else {
                            strncpy_s(lines[n], 1024, buf, _TRUNCATE);
                        }
                    } else { strncpy_s(lines[n], 1024, buf, _TRUNCATE); }
                    n++;
                }
                fclose(sf);
                sf = NULL; fopen_s(&sf, p2, "w");
                if (sf) { for (int i = 0; i < n; i++) fputs(lines[i], sf); fclose(sf); }
            }
            MessageBoxA(NULL, "Pairing mode: press any number key on your external numpad to pair it.", "PieMenu", MB_OK | MB_ICONINFORMATION);
            g_settingsVersion = fileVersion;
        }
    }
    if (needReload) {
        bool savedNumpad = g_numpadEnabled;
        LoadSettings();
        g_numpadEnabled = savedNumpad;
        RegisterTriggerHotkey();
    }
    if (g_dumpEffectsPending) {
        DumpEffectNames();
        char p2[MAX_PATH]; GetSettingsPath(p2, sizeof(p2));
        FILE *sf = NULL; fopen_s(&sf, p2, "r");
        char lines[256][1024]; int n = 0;
        if (sf) {
            char buf[1024];
            while (fgets(buf, sizeof(buf), sf) && n < 256) {
                char k[64] = {0};
                if (sscanf_s(buf, " %63[^=]", k, 64) >= 1 && strcmp(k, "dump_effects") == 0) {
                    _snprintf_s(lines[n], 1024, _TRUNCATE, "dump_effects=0\n");
                } else {
                    strncpy_s(lines[n], 1024, buf, _TRUNCATE);
                }
                n++;
            }
            fclose(sf);
            sf = NULL; fopen_s(&sf, p2, "w");
            if (sf) {
                for (int i = 0; i < n; i++) fputs(lines[i], sf);
                fclose(sf);
            }
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
    return A_Err_NONE;
}

A_Err EntryPointFunc(struct SPBasicSuite *pica_basicP, A_long, A_long, AEGP_PluginID id, AEGP_GlobalRefcon *gr)
{
    CoInitialize(NULL);
    S_id = id; sP = pica_basicP;
    A_Err err = A_Err_NONE;
    AEGP_SuiteHandler suites(pica_basicP);

    const char *labels[8] = {"wb tools pack", "Quick Menu", "Wheel Menu", "Save Eff", "Apply Eff", "List Numpad Devices", "Preview Menu", "Pair Numpad"};
    for (int i = 0; i < 8; i++) {
        ERR(suites.CommandSuite1()->AEGP_GetUniqueCommand(&S_pi_cmd[i]));
        if (S_pi_cmd[i])
            ERR(suites.CommandSuite1()->AEGP_InsertMenuCommand(S_pi_cmd[i], labels[i], (i < 3 || i == 5) ? AEGP_Menu_WINDOW : AEGP_Menu_EDIT, AEGP_MENU_INSERT_SORTED));
    }

    ERR(suites.RegisterSuite5()->AEGP_RegisterCommandHook(S_id, AEGP_HP_BeforeAE, AEGP_Command_ALL, CommandHook, 0));
    ERR(suites.RegisterSuite5()->AEGP_RegisterUpdateMenuHook(S_id, UpdateMenuHook, 0));
    ERR(suites.RegisterSuite5()->AEGP_RegisterIdleHook(S_id, IdleHook, 0));

    LoadSettings();
    InitRawWindow();
    return err;
}
