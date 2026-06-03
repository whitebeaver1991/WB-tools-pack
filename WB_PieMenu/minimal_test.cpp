#include <windows.h>
#include "AEConfig.h"
#include "AE_General.h"
#include "AE_Macros.h"
#include "AEGP_SuiteHandler.h"
#include "AEGP_CommandSuite1.h"
#include "AEGP_RegisterSuite5.h"

extern "C" __declspec(dllexport) A_Err EntryPointFunc(
    SPBasicSuite *pica_basicP,
    A_long        major_versionL,
    A_long        minor_versionL,
    AEGP_PluginID aegp_plugin_id,
    AEGP_GlobalRefcon *global_refconP)
{
    FILE *f = fopen("C:\\Temp\\minimal_test.txt", "w");
    if (f) {
        fprintf(f, "EntryPointFunc called\n");
        fprintf(f, "major=%ld minor=%ld\n", major_versionL, minor_versionL);
        fprintf(f, "plugin_id=%p\n", aegp_plugin_id);
        fclose(f);
    }

    if (!pica_basicP) return A_Err_GENERIC;

    AEGP_SuiteHandler suites(pica_basicP);
    A_Err err = A_Err_NONE;

    AEGP_Command cmd = 0;
    err = suites.CommandSuite1()->AEGP_GetUniqueCommand(&cmd);
    if (err) return err;

    err = suites.CommandSuite1()->AEGP_InsertMenuCommand(
        cmd, "Minimal Test",
        AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
    if (err) return err;

    FILE *g = fopen("C:\\Temp\\minimal_test.txt", "a");
    if (g) {
        fprintf(g, "SUCCESS: Menu registered\n");
        fclose(g);
    }

    return A_Err_NONE;
}
