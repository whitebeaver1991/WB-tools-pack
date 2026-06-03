#pragma once

typedef enum {
	StrID_NONE,
	StrID_Name,
	StrID_Description,
	StrID_MarkerText,
	StrID_URL,
	StrID_Chapter,
	StrID_SuiteError,
	StrID_NUMTYPES
} StrIDType;

char	*GetStringPtr(int strNum);
