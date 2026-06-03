#include "WB_EffectDumper.h"

typedef struct {
	unsigned long	index;
	char			str[256];
} TableString;

TableString g_strs[StrID_NUMTYPES] = {
	StrID_NONE,			"",
	StrID_Name,			"WB Effect Dumper",
	StrID_Description,	"Dumps effect names to desktop CSV.",
};

char *GetStringPtr(int strNum)
{
	return g_strs[strNum].str;
}
