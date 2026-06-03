#define PiPL 2800
#define AE_PIPL_ITEM_PROP 'prPi'
#define AE_PIPL_KIND 'kind'
#define AE_PIPL_NAME 'name'
#define AE_PIPL_CATEGORY 'cat '
#define AE_PIPL_VERSION 'vers'
#define AE_PIPL_ENTRY_FUNC 'func'
#define AE_PIPL_MATCH_NAME 'mnam'
#define AEGP 'AEG'
#define CodeWin64X86 'x86 '

resource 'PiPL' (2800) {
    {
        Kind {
            AEGP
        },
        Name {
            "WB Pie Menu"
        },
        Category {
            "General Plugin"
        },
        Version {
            196608
        },
        CodeWin64X86 {"EntryPointFunc"}
    }
};
