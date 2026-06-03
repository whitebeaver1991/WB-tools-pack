#include "AEConfig.h"
#ifdef AE_OS_WIN
	#include <windows.h>
	#include <shlobj.h>
	#include <stdio.h>
	#include <stdlib.h>
#endif

#include "entry.h"
#include "AE_GeneralPlug.h"
#include "AE_Macros.h"
#include "AEGP_SuiteHandler.h"
#include "String_Utils.h"
#include "WB_EffectDumper_Strings.h"

extern "C" DllExport AEGP_PluginInitFuncPrototype EntryPointFunc;

#define VER_MAJOR 3
#define VER_MINOR 0
#define VER_PATCH 1
#define VER_STR "v3.0.1"

static AEGP_Command      S_cmd         = 0L;
static AEGP_Command      S_keyTestCmd  = 0L;
static AEGP_PluginID     S_id          = 0L;
static SPBasicSuite     *sP            = NULL;

static const char* DescribeVK(int vk)
{
    if (vk >= VK_NUMPAD0 && vk <= VK_NUMPAD9)
    {
        static const char *numpad_digits[] = {
            "VK_NUMPAD0","VK_NUMPAD1","VK_NUMPAD2","VK_NUMPAD3","VK_NUMPAD4",
            "VK_NUMPAD5","VK_NUMPAD6","VK_NUMPAD7","VK_NUMPAD8","VK_NUMPAD9"
        };
        return numpad_digits[vk - VK_NUMPAD0];
    }
    switch (vk)
    {
        case VK_MULTIPLY:  return "VK_MULTIPLY (*)";
        case VK_ADD:       return "VK_ADD (+)";
        case VK_SEPARATOR: return "VK_SEPARATOR";
        case VK_SUBTRACT:  return "VK_SUBTRACT (-)";
        case VK_DECIMAL:   return "VK_DECIMAL (.)";
        case VK_DIVIDE:    return "VK_DIVIDE (/)";
        case VK_RETURN:    return "VK_RETURN (Enter)";
        case VK_SHIFT:     return "VK_SHIFT";
        case VK_CONTROL:   return "VK_CONTROL";
        case VK_MENU:      return "VK_MENU (Alt)";
        case VK_CAPITAL:   return "VK_CAPITAL";
        case VK_TAB:       return "VK_TAB";
        case VK_SPACE:     return "VK_SPACE";
        case VK_DELETE:    return "VK_DELETE";
        case VK_BACK:      return "VK_BACK (Backspace)";
        case VK_ESCAPE:    return "VK_ESCAPE";
        case VK_F1:        return "VK_F1";
        case VK_F2:        return "VK_F2";
        case VK_F3:        return "VK_F3";
        case VK_F4:        return "VK_F4";
        case VK_F5:        return "VK_F5";
        case VK_F6:        return "VK_F6";
        case VK_F7:        return "VK_F7";
        case VK_F8:        return "VK_F8";
        case VK_F9:        return "VK_F9";
        case VK_F10:       return "VK_F10";
        case VK_F11:       return "VK_F11";
        case VK_F12:       return "VK_F12";
        case VK_SNAPSHOT:  return "VK_SNAPSHOT (PrtSc)";
        case VK_SCROLL:    return "VK_SCROLL";
        case VK_PAUSE:     return "VK_PAUSE";
        case VK_INSERT:    return "VK_INSERT";
        case VK_HOME:      return "VK_HOME";
        case VK_END:       return "VK_END";
        case VK_PRIOR:     return "VK_PRIOR (PgUp)";
        case VK_NEXT:      return "VK_NEXT (PgDn)";
    }
    if (vk >= 0x30 && vk <= 0x39) { static char buf[32]; _snprintf_s(buf, sizeof(buf), _TRUNCATE, "VK_0-9 '%c'", (char)vk); return buf; }
    if (vk >= 0x41 && vk <= 0x5A) { static char buf[32]; _snprintf_s(buf, sizeof(buf), _TRUNCATE, "VK_A-Z '%c'", (char)(vk + 0x20)); return buf; }
    static char buf[48]; _snprintf_s(buf, sizeof(buf), _TRUNCATE, "VK_RAW (0x%02X)", vk); return buf;
}

// Thread parameter structure
struct PollThreadParams {
    char logPath[MAX_PATH * 2];
    volatile LONG finished;
    int totalKeys;
    int totalSamples;
};

static DWORD WINAPI PollThreadProc(LPVOID lpParam)
{
    PollThreadParams *params = (PollThreadParams*)lpParam;
    FILE *f = NULL; fopen_s(&f, params->logPath, "w");
    if (!f) { params->finished = 1; return 1; }

    fprintf(f, "WB Key Intercept Test %s\n", VER_STR);
    fprintf(f, "Using GetAsyncKeyState polling (20 Hz) on background thread.\n");
    fprintf(f, "============================================\n\n");
    fflush(f);

    // Pre-clear all VKs
    for (int vk = 0; vk < 256; vk++) GetAsyncKeyState(vk);

    DWORD startTick = GetTickCount();
    int keyCount = 0, sampleCount = 0;

    while (GetTickCount() - startTick < 30000 && !params->finished)
    {
        for (int vk = 0; vk < 256; vk++)
        {
            SHORT state = GetAsyncKeyState(vk);
            if (state & 1)
            {
                keyCount++;
                fprintf(f, "[%4d] vk=0x%02X (%3d) - %s\n",
                    keyCount, vk, vk, DescribeVK(vk));
                fflush(f);
            }
        }
        sampleCount++;
        Sleep(50);
    }

    fprintf(f, "\n============================================\n");
    fprintf(f, "Samples: %d, Total keys: %d\n", sampleCount, keyCount);
    fclose(f);

    params->totalKeys = keyCount;
    params->totalSamples = sampleCount;
    InterlockedExchange(&params->finished, 1);
    return 0;
}

static void KeyInterceptTest(void)
{
    char desktop[MAX_PATH] = {0};
    SHGetFolderPathA(NULL, CSIDL_DESKTOP, NULL, 0, desktop);
    char logPath[MAX_PATH];
    _snprintf_s(logPath, sizeof(logPath), _TRUNCATE, "%s\\wb_key_test_log.txt", desktop);

    char title[128];
    _snprintf_s(title, sizeof(title), _TRUNCATE, "WB Key Intercept Test %s", VER_STR);

    char info[1536];
    _snprintf_s(info, sizeof(info), _TRUNCATE,
        "WB Effect Dumper %s\n"
        "Key Intercept Test\n\n"
        "Click OK to start 30-second capture.\n"
        "Uses background thread + GetAsyncKeyState.\n"
        "AE will remain responsive.\n\n"
        "Log: %s\n\n"
        "Keypad keys will appear as VK_NUMPAD* or VK_RETURN.\n\n"
        "Build: " __DATE__ " " __TIME__,
        VER_STR, logPath);

    MessageBoxA(NULL, info, title, MB_OK | MB_ICONINFORMATION);

    PollThreadParams params;
    strcpy_s(params.logPath, sizeof(params.logPath), logPath);
    params.finished = 0;
    params.totalKeys = 0;
    params.totalSamples = 0;

    HANDLE hThread = CreateThread(NULL, 0, PollThreadProc, &params, 0, NULL);
    if (!hThread)
    {
        MessageBoxA(NULL, "Failed to create polling thread!", title, MB_OK | MB_ICONERROR);
        return;
    }

    // Message-pumping wait: keeps AE responsive while thread runs
    for (;;)
    {
        DWORD waitResult = MsgWaitForMultipleObjects(1, &hThread, FALSE, 31000, QS_ALLINPUT);
        if (waitResult == WAIT_OBJECT_0)
        {
            // Thread finished
            break;
        }
        else if (waitResult == WAIT_OBJECT_0 + 1)
        {
            // Messages available — pump them so AE stays alive
            MSG msg;
            while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
            {
                TranslateMessage(&msg);
                DispatchMessage(&msg);
            }
        }
        else
        {
            // Timeout or error
            break;
        }
    }

    CloseHandle(hThread);

    char result[4096];
    _snprintf_s(result, sizeof(result), _TRUNCATE,
        "Capture stopped.\n"
        "Samples: %d\n"
        "Key-down events: %d\n\n"
        "Log file: %s\n\n"
        "Look for VK_NUMPAD* or VK_RETURN entries.\n"
        "External keypad Enter == VK_RETURN (0x0D).",
        params.totalSamples, params.totalKeys, logPath);
    MessageBoxA(NULL, result, title, MB_OK | MB_ICONINFORMATION);
}

static void DumpEffects(void)
{
	AEGP_SuiteHandler s(sP);

	char desktop[MAX_PATH] = {0};
	SHGetFolderPathA(NULL, CSIDL_DESKTOP, NULL, 0, desktop);
	char csvPath[MAX_PATH];
	_snprintf_s(csvPath, sizeof(csvPath), _TRUNCATE, "%s\\ae_effects_dump.csv", desktop);

	FILE *f = NULL; fopen_s(&f, csvPath, "wb");
	if (!f) return;
	const unsigned char bom[] = {0xEF, 0xBB, 0xBF};
	fwrite(bom, 1, 3, f);
	fputs("display_name,match_name\n", f);

	A_long count = 0;
	s.EffectSuite4()->AEGP_GetNumInstalledEffects(&count);

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
						bool q = (strchr(u, ',') || strchr(u, '"'));
						if (q) fputc('"', f);
						for (char *p = u; *p; p++) { if (*p == '"') fputc('"', f); fputc(*p, f); }
						if (q) fputc('"', f);
						free(u);
					}
					free(w);
				}
			}
			fputc(',', f);
			bool q = (strchr(match, ',') || strchr(match, '"'));
			if (q) fputc('"', f);
			for (char *p = match; *p; p++) { if (*p == '"') fputc('"', f); fputc(*p, f); }
			if (q) fputc('"', f);
			fputc('\n', f);
		}
		AEGP_InstalledEffectKey nextIk = 0;
		e = s.EffectSuite4()->AEGP_GetNextInstalledEffect(ik, &nextIk);
		ik = nextIk;
	}
	fclose(f);

	char msg[1024];
	_snprintf_s(msg, sizeof(msg), _TRUNCATE,
		"WB Effect Dumper %s\n\nExported %d effects to desktop\nFile: ae_effects_dump.csv",
		VER_STR, count);
	MessageBoxA(NULL, msg, "WB Effect Dumper", MB_OK | MB_ICONINFORMATION);
}

static A_Err CommandHook(AEGP_GlobalRefcon, AEGP_CommandRefcon, AEGP_Command cmd,
						 AEGP_HookPriority, A_Boolean, A_Boolean *handledPB)
{
	if (cmd == S_cmd) {
		DumpEffects();
		*handledPB = TRUE;
	}
	else if (cmd == S_keyTestCmd) {
		KeyInterceptTest();
		*handledPB = TRUE;
	}
	return A_Err_NONE;
}

static A_Err UpdateMenuHook(AEGP_GlobalRefcon, AEGP_UpdateMenuRefcon, AEGP_WindowType)
{
	AEGP_SuiteHandler s(sP);
	s.CommandSuite1()->AEGP_EnableCommand(S_cmd);
	s.CommandSuite1()->AEGP_EnableCommand(S_keyTestCmd);
	return A_Err_NONE;
}

A_Err EntryPointFunc(struct SPBasicSuite *pica_basicP, A_long, A_long,
					 AEGP_PluginID aegp_plugin_id, AEGP_GlobalRefcon *global_refconP)
{
	S_id = aegp_plugin_id;
	sP   = pica_basicP;
	AEGP_SuiteHandler s(pica_basicP);

	A_Err e;
	e = s.CommandSuite1()->AEGP_GetUniqueCommand(&S_cmd);
	if (e) return e;
	e = s.CommandSuite1()->AEGP_InsertMenuCommand(S_cmd, "Dump Effect Names",
		AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
	if (e) return e;
	e = s.RegisterSuite5()->AEGP_RegisterCommandHook(S_id, AEGP_HP_BeforeAE,
		S_cmd, CommandHook, 0);
	if (e) return e;

	e = s.CommandSuite1()->AEGP_GetUniqueCommand(&S_keyTestCmd);
	if (e) return e;
	e = s.CommandSuite1()->AEGP_InsertMenuCommand(S_keyTestCmd, "Key Intercept Test",
		AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
	if (e) return e;
	e = s.RegisterSuite5()->AEGP_RegisterCommandHook(S_id, AEGP_HP_BeforeAE,
		S_keyTestCmd, CommandHook, 0);
	if (e) return e;

	e = s.RegisterSuite5()->AEGP_RegisterUpdateMenuHook(S_id, UpdateMenuHook, 0);

	*global_refconP = NULL;
	return A_Err_NONE;
}
