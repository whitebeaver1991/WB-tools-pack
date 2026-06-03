#define _CRT_SECURE_NO_WARNINGS

#include "AEEffectManager.h"
#include "WB_PieMenu.h"
#include <string.h>

static A_Err FindEffectByMatchName(
    const wchar_t* match_name,
    AEGP_InstalledEffectKey* out_key)
{
    if (!S_sp_basic || !match_name || !out_key) return A_Err_GENERIC;
    *out_key = NULL;

    try {
        AEGP_SuiteHandler suites(S_sp_basic);
        AEGP_EffectSuite5 *eff = suites.EffectSuite5();
        if (!eff) return A_Err_GENERIC;

        A_long count = 0;
        A_Err err = eff->AEGP_GetNumInstalledEffects(&count);
        if (err || count == 0) return err;

        AEGP_InstalledEffectKey key = NULL;
        wchar_t current_name[256];

        for (A_long i = 0; i < count; i++) {
            err = eff->AEGP_GetNextInstalledEffect(i == 0 ? NULL : key, &key);
            if (err || !key) continue;

            A_char nameZ[AEGP_MAX_EFFECT_MATCH_NAME_SIZE] = {0};
            err = eff->AEGP_GetEffectMatchName(key, nameZ);
            if (err || nameZ[0] == '\0') continue;

            size_t len = strlen(nameZ) + 1;
            mbstowcs(current_name, nameZ, len);

            if (_wcsicmp(current_name, match_name) == 0) {
                *out_key = key;
                return A_Err_NONE;
            }
        }
    } catch (...) {}

    return A_Err_GENERIC;
}

A_Err ApplyEffectToSelectedLayer(const wchar_t* match_name)
{
    if (!S_sp_basic || !match_name) return A_Err_GENERIC;

    try {
        AEGP_SuiteHandler suites(S_sp_basic);

        AEGP_InstalledEffectKey effect_key = NULL;
        A_Err err = FindEffectByMatchName(match_name, &effect_key);
        if (err || !effect_key) return err;

        AEGP_LayerH layerH = NULL;
        err = suites.LayerSuite9()->AEGP_GetActiveLayer(&layerH);
        if (err || !layerH) return err;

        AEGP_EffectRefH effect_ref = NULL;
        err = suites.EffectSuite5()->AEGP_ApplyEffect(
            S_plugin_id, layerH, effect_key, &effect_ref);

        if (!err && effect_ref) {
            suites.EffectSuite5()->AEGP_DisposeEffect(effect_ref);
        }

        return err;
    } catch (...) {}

    return A_Err_GENERIC;
}
