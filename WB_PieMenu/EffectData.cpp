#include "EffectData.h"
#include "AEEffectManager.h"

static const PieEffect g_sample_effects[] = {
    { L"Levels",                 L"ADBE Levels" },
    { L"Curves",                 L"ADBE Curves" },
    { L"Hue/Saturation",         L"ADBE Hue Sat" },
    { L"Color Balance",          L"ADBE Color Balance" },
    { L"Gaussian Blur",          L"ADBE Gaussian Blur" },
    { L"Directional Blur",       L"ADBE Directional Blur" },
    { L"Radial Blur",            L"ADBE Radial Blur" },
    { L"Camera Lens Blur",       L"ADBE Camera Lens Blur" },
    { L"Glow",                   L"ADBE Glo2" },
    { L"Drop Shadow",            L"ADBE Drop Shadow" },
    { L"Stroke",                 L"ADBE Stroke" },
    { L"Transform",              L"ADBE Transform" },
};

static const int g_sample_count = sizeof(g_sample_effects) / sizeof(g_sample_effects[0]);

int GetEffectList(const PieEffect** out_effects)
{
    if (out_effects) {
        *out_effects = g_sample_effects;
    }
    return g_sample_count;
}

void ApplySelectedEffect(const wchar_t* match_name)
{
    ApplyEffectToSelectedLayer(match_name);
}
