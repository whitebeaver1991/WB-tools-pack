#pragma once

struct PieEffect {
    const wchar_t* label;
    const wchar_t* matchName;
};

int GetEffectList(const PieEffect** out_effects);
void ApplySelectedEffect(const wchar_t* match_name);
