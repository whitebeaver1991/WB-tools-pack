#ifndef WB_PIEMENU_H
#define WB_PIEMENU_H

#include <AEConfig.h>
#ifdef AE_OS_WIN
	#include <windows.h>
#endif

#include <AE_GeneralPlug.h>
#include <AEGP_SuiteHandler.h>
#include <entry.h>
#include <AE_Macros.h>

#define PLUGIN_NAME         L"WB Pie Menu"
#define PLUGIN_MATCH        "WBPieMenu"
#define PLUGIN_DESCRIPTION  "Pie Menu, Wheel Menu, and Search Menu for AE"

extern AEGP_PluginID    S_plugin_id;
extern SPBasicSuite     *S_sp_basic;
extern AEGP_Command     S_cmd_pie;
extern AEGP_Command     S_cmd_wheel;
extern AEGP_Command     S_cmd_search;

extern A_Err CommandHookFunc(
    AEGP_GlobalRefcon    plugin_refcon,
    AEGP_CommandRefcon   refcon,
    AEGP_Command         command,
    AEGP_HookPriority    hook_priority,
    A_Boolean            already_handled,
    A_Boolean            *handledPB);

extern A_Err UpdateMenuHookFunc(
    AEGP_GlobalRefcon        plugin_refcon,
    AEGP_UpdateMenuRefcon    refcon,
    AEGP_WindowType          active_window);

#endif
