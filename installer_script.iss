[Setup]
AppName=Aether Sleep
AppVersion=1.0.0-RC
AppPublisher=PowerTimer Team
DefaultDirName={autopf}\Aether Sleep
DefaultGroupName=Aether Sleep
OutputDir=C:\PROJECT\Aether Sleep\Build_Outputs\
OutputBaseFilename=AetherSleep_v1.0.0-RC_Setup
Compression=lzma2/ultra
SolidCompression=yes
SetupIconFile=C:\PROJECT\Aether Sleep\Hibernation APP\icon.ico
UninstallDisplayIcon={app}\PowerTimer.exe
PrivilegesRequired=lowest

[Tasks]
Name: "desktopicon"; Description: "Buat shortcut di Desktop"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "C:\PROJECT\Aether Sleep\AetherSleep\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Aether Sleep"; Filename: "{app}\PowerTimer.exe"
Name: "{group}\Uninstall Aether Sleep"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Aether Sleep"; Filename: "{app}\PowerTimer.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PowerTimer.exe"; Description: "Jalankan Aether Sleep sekarang"; Flags: nowait postinstall skipifsilent
