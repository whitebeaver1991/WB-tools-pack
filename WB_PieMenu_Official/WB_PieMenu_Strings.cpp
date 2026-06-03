#include "WB_PieMenu_Strings.h"

typedef struct {
	unsigned long	index;
	char			str[256];
} TableString;

TableString g_strs[StrID_NUMTYPES] = {
	StrID_NONE,			"",
	StrID_Name,			"WB Pie Menu",
	StrID_Description,	"Pie menu plug-in for After Effects.",
};

char *GetStringPtr(int strNum)
{
	return g_strs[strNum].str;
}
