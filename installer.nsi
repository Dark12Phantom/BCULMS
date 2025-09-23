RequestExecutionLevel user

!include "MUI2.nsh"

Name "BCULMS"
OutFile "BCULMS_Installer.exe"
InstallDir "$LOCALAPPDATA\BCULMS"

InstallDirRegKey HKCU "Software\BCULMS" "InstallDir"

Page directory
Page instfiles

Section "Install"
    ; Set target path where files go
    SetOutPath "$INSTDIR"

    ; Copy all files from dist folder
    File /r "dist\*.*"

    ; Save chosen directory for next time
    WriteRegStr HKCU "Software\BCULMS" "InstallDir" "$INSTDIR"

    ; Create a desktop shortcut directly to the exe
    CreateShortcut "$DESKTOP\BCULMS.lnk" "$INSTDIR\BCULMS\BCULMS-win_x64.exe"

    ; Optionally, create a Start Menu shortcut too
    CreateDirectory "$SMPROGRAMS\BCULMS"
    CreateShortcut "$SMPROGRAMS\BCULMS\BCULMS.lnk" "$INSTDIR\BCULMS\BCULMS-win_x64.exe"
SectionEnd
