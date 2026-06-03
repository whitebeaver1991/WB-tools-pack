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
