#include <stdio.h>
#include <windows.h>
#include "WB_PieMenu.h"
#include "PieOverlay.h"
#include "WheelOverlay.h"
#include "SearchOverlay.h"

AEGP_PluginID    S_plugin_id = NULL;
SPBasicSuite     *S_sp_basic = NULL;
AEGP_Command     S_cmd_pie   = 0;
AEGP_Command     S_cmd_wheel = 0;
AEGP_Command     S_cmd_search = 0;

static HWND GetWindowHandle(void)
{
    if (!S_sp_basic) return NULL;
    HWND hwnd = NULL;
    try {
        AEGP_SuiteHandler suites(S_sp_basic);
        AEGP_UtilitySuite6 *util = suites.UtilitySuite6();
        if (util) {
            void *p = NULL;
            util->AEGP_GetMainHWND(&p);
            hwnd = static_cast<HWND>(p);
        }
    } catch (...) {}
    return hwnd;
}

A_Err CommandHookFunc(
    AEGP_GlobalRefcon    plugin_refcon,
    AEGP_CommandRefcon   refcon,
    AEGP_Command         command,
    AEGP_HookPriority    hook_priority,
    A_Boolean            already_handled,
    A_Boolean            *handledPB)
{
    if (already_handled) return A_Err_NONE;
    if (!handledPB) return A_Err_NONE;

    HWND hwnd = GetWindowHandle();
    if (!hwnd) return A_Err_NONE;

    if (command == S_cmd_pie) {
        ShowPieOverlay(hwnd);
        *handledPB = TRUE;
    } else if (command == S_cmd_wheel) {
        ShowWheelOverlay(hwnd);
        *handledPB = TRUE;
    } else if (command == S_cmd_search) {
        ShowSearchOverlay(hwnd);
        *handledPB = TRUE;
    }

    return A_Err_NONE;
}

A_Err UpdateMenuHookFunc(
    AEGP_GlobalRefcon        plugin_refcon,
    AEGP_UpdateMenuRefcon    refcon,
    AEGP_WindowType          active_window)
{
    return A_Err_NONE;
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved)
{
    if (ul_reason_for_call == DLL_PROCESS_ATTACH) {
        FILE *f = fopen("C:\\Temp\\WB_PieMenu_debug.txt", "w");
        if (f) {
            fprintf(f, "DllMain: DLL_PROCESS_ATTACH\n");
            fclose(f);
        }
    }
    return TRUE;
}

static void DebugLog(const char *msg)
{
    FILE *f = fopen("C:\\Temp\\WB_PieMenu_debug.txt", "a");
    if (f) {
        fprintf(f, "%s\n", msg);
        fclose(f);
    }
}

extern "C" DllExport A_Err EntryPointFunc(
    SPBasicSuite *pica_basicP,
    A_long        major_versionL,
    A_long        minor_versionL,
    AEGP_PluginID aegp_plugin_id,
    AEGP_GlobalRefcon *global_refconP)
{
    S_sp_basic = pica_basicP;
    S_plugin_id = aegp_plugin_id;

    DebugLog("=== EntryPointFunc CALLED ===");

    // Manually acquire only the suites we need
    AEGP_CommandSuite1 *cmd_suite = NULL;
    AEGP_RegisterSuite5 *reg_suite = NULL;

    {
        char buf[256];
        sprintf(buf, "  major=%ld minor=%ld", major_versionL, minor_versionL);
        DebugLog(buf);
    }

    if (pica_basicP->AcquireSuite(kAEGPCommandSuite, kAEGPCommandSuiteVersion1, (const void**)&cmd_suite) != A_Err_NONE || !cmd_suite) {
        DebugLog("  FAILED: Acquire AEGP_CommandSuite1");
        return A_Err_GENERIC;
    }
    DebugLog("  OK: Acquired AEGP_CommandSuite1");

    if (pica_basicP->AcquireSuite(kAEGPRegisterSuite, kAEGPRegisterSuiteVersion5, (const void**)&reg_suite) != A_Err_NONE || !reg_suite) {
        DebugLog("  FAILED: Acquire AEGP_RegisterSuite5");
        pica_basicP->ReleaseSuite(kAEGPCommandSuite, kAEGPCommandSuiteVersion1);
        return A_Err_GENERIC;
    }
    DebugLog("  OK: Acquired AEGP_RegisterSuite5");

    A_Err err = A_Err_NONE;

    err = cmd_suite->AEGP_GetUniqueCommand(&S_cmd_pie);
    if (err) { DebugLog("  FAILED: GetUniqueCommand pie"); goto cleanup; }
    DebugLog("  OK: Got pie command");

    err = cmd_suite->AEGP_InsertMenuCommand(
        S_cmd_pie, "WB Pie Menu (Ctrl+Shift+1)",
        AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
    if (err) { DebugLog("  FAILED: InsertMenuCommand pie"); goto cleanup; }
    DebugLog("  OK: Inserted pie menu");

    err = cmd_suite->AEGP_GetUniqueCommand(&S_cmd_wheel);
    if (err) { DebugLog("  FAILED: GetUniqueCommand wheel"); goto cleanup; }
    DebugLog("  OK: Got wheel command");

    err = cmd_suite->AEGP_InsertMenuCommand(
        S_cmd_wheel, "WB Wheel Menu (Ctrl+Shift+2)",
        AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
    if (err) { DebugLog("  FAILED: InsertMenuCommand wheel"); goto cleanup; }
    DebugLog("  OK: Inserted wheel menu");

    err = cmd_suite->AEGP_GetUniqueCommand(&S_cmd_search);
    if (err) { DebugLog("  FAILED: GetUniqueCommand search"); goto cleanup; }
    DebugLog("  OK: Got search command");

    err = cmd_suite->AEGP_InsertMenuCommand(
        S_cmd_search, "WB Search Menu (Ctrl+Shift+3)",
        AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
    if (err) { DebugLog("  FAILED: InsertMenuCommand search"); goto cleanup; }
    DebugLog("  OK: Inserted search menu");

    err = reg_suite->AEGP_RegisterCommandHook(
        aegp_plugin_id, AEGP_HP_BeforeAE,
        AEGP_Command_ALL,
        CommandHookFunc, 0);
    if (err) { DebugLog("  FAILED: RegisterCommandHook"); goto cleanup; }
    DebugLog("  OK: Registered command hook");

    err = reg_suite->AEGP_RegisterUpdateMenuHook(
        aegp_plugin_id, UpdateMenuHookFunc, 0);
    if (err) { DebugLog("  FAILED: RegisterUpdateMenuHook"); goto cleanup; }
    DebugLog("  OK: Registered update menu hook");

    DebugLog("=== EntryPointFunc SUCCESS ===");

cleanup:
    pica_basicP->ReleaseSuite(kAEGPCommandSuite, kAEGPCommandSuiteVersion1);
    pica_basicP->ReleaseSuite(kAEGPRegisterSuite, kAEGPRegisterSuiteVersion5);
    return err;
}
