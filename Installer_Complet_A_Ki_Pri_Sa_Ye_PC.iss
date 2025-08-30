
; Script Inno Setup - VERSION PC COMPLÈTE - A Ki Pri Sa Yé
[Setup]
AppName=A Ki Pri Sa Yé
AppVersion=1.0.0
DefaultDirName=C:\A Ki Pri Sa Yé
DefaultGroupName=A Ki Pri Sa Yé
UninstallDisplayIcon={app}\akiprisaye.exe
OutputDir=.
OutputBaseFilename=Setup_A_Ki_Pri_Sa_Ye_PC
Compression=lzma
SolidCompression=yes
SetupIconFile=Assets\akiprisaye.ico
WizardSmallImageFile=Assets\wizard_small.bmp
WizardImageFile=Assets\wizard.bmp
WizardImageBackColor=clWhite
DisableDirPage=no

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; Fichiers principaux
Source: "akiprisaye.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "settings.ini"; DestDir: "{app}"; Flags: ignoreversion
Source: "activation.lic"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.txt"; DestDir: "{app}"; Flags: ignoreversion

; Documentation
Source: "Docs\*"; DestDir: "{app}\Docs"; Flags: ignoreversion recursesubdirs createallsubdirs

; Fichiers IA
Source: "IA\*"; DestDir: "{app}\IA"; Flags: ignoreversion recursesubdirs createallsubdirs

; Voix
Source: "Audio\*"; DestDir: "{app}\Audio"; Flags: ignoreversion recursesubdirs createallsubdirs

; Assets visuels
Source: "Assets\*"; DestDir: "{app}\Assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\A Ki Pri Sa Yé"; Filename: "{app}\akiprisaye.exe"
Name: "{commondesktop}\A Ki Pri Sa Yé"; Filename: "{app}\akiprisaye.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\akiprisaye.exe"; Description: "Lancer l'application"; Flags: nowait postinstall skipifsilent

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes supplémentaires:"
