cmake_minimum_required(VERSION 3.16)
project(WBPieMenu)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ══════ SDK Path ══════
# Change this to your actual AE SDK Examples folder
set(AE_SDK_ROOT "E:/AfterEffectsSDK_25.2_20_win/ae25.2_20.64bit.AfterEffectsSDK/AfterEffectsSDK/Examples")

set(AE_INCLUDE_DIRS
    "${AE_SDK_ROOT}/Headers"
    "${AE_SDK_ROOT}/Headers/SP"
    "${AE_SDK_ROOT}/Headers/Win"
    "${AE_SDK_ROOT}/Resources"
    "${AE_SDK_ROOT}/Util"
)

set(AE_SDK_SOURCES
    "${AE_SDK_ROOT}/Util/AEGP_SuiteHandler.cpp"
    "${AE_SDK_ROOT}/Util/MissingSuiteError.cpp"
)

# ══════ Our Sources ══════
set(SOURCES
    WB_PieMenu.cpp
    PieOverlay.cpp
    WheelOverlay.cpp
    SearchOverlay.cpp
    AEEffectManager.cpp
)

set(HEADERS
    WB_PieMenu.h
    PieOverlay.h
    WheelOverlay.h
    SearchOverlay.h
    AEEffectManager.h
)

# ══════ PiPL: generate binary via PowerShell ══════
# This generates PiPL.bin and PiPL.rc in the source directory.
# PiPL.rc is #included by Resource.rc.
set(PIPL_SCRIPT "${CMAKE_CURRENT_SOURCE_DIR}/generate_pipl.ps1")
set(PIPL_BIN    "${CMAKE_CURRENT_SOURCE_DIR}/PiPL.bin")

add_custom_command(
    OUTPUT  ${PIPL_BIN}
    COMMAND powershell -ExecutionPolicy Bypass -File ${PIPL_SCRIPT} -OutputDir "${CMAKE_CURRENT_SOURCE_DIR}"
    DEPENDS ${PIPL_SCRIPT}
    COMMENT "Generating PiPL binary resource..."
)

add_custom_target(PiPL_Gen DEPENDS ${PIPL_BIN})

# ══════ DLL Target ══════
add_library(${PROJECT_NAME} SHARED
    ${SOURCES}
    ${HEADERS}
    ${AE_SDK_SOURCES}
    Resource.rc
)

add_dependencies(${PROJECT_NAME} PiPL_Gen)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${AE_INCLUDE_DIRS}
)

target_compile_definitions(${PROJECT_NAME} PRIVATE
    AE_PROC_AMD64=1
    _WINDOWS=1
    _USRDLL=1
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    user32
    gdi32
    comctl32
    comdlg32
    winspool
    ole32
    oleaut32
    uuid
)

set_target_properties(${PROJECT_NAME} PROPERTIES
    SUFFIX ".aex"
    PREFIX ""
    LINK_FLAGS "/EXPORT:EntryPointFunc"
)
