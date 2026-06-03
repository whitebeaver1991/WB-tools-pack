#include "AEConfig.h"
#ifdef AE_OS_WIN
	#include <windows.h>
#endif

#include "entry.h"
#include "AE_GeneralPlug.h"
#include "AE_Macros.h"
#include "AEGP_SuiteHandler.h"
#include "String_Utils.h"
#include "Easy_Cheese_Strings.h"

#define AEGP_MAX_STREAM_DIM 4

extern "C" DllExport AEGP_PluginInitFuncPrototype EntryPointFunc;
