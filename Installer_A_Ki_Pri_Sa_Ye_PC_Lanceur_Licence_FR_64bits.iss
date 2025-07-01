
; Script Inno Setup - Version sécurisée avec licence + détection système
[Setup]
AppName=A Ki Pri Sa Yé
AppVersion=1.0.0
DefaultDirName=C:\A Ki Pri Sa Yé
DefaultGroupName=A Ki Pri Sa Yé
UninstallDisplayIcon={app}\Lanceur_A_Ki_Pri_Sa_Ye.exe
OutputDir=.
OutputBaseFilename=Setup_A_Ki_Pri_Sa_Ye_PC_Licence_FR64
Compression=lzma
SolidCompression=yes
SetupIconFile=Assets\akiprisaye.ico
WizardSmallImageFile=Assets\wizard_small.bmp
WizardImageFile=Assets\wizard.bmp
WizardImageBackColor=clWhite
DisableDirPage=no
LicenseFile=Docs\Notice_Utilisateur.pdf
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "Lanceur_A_Ki_Pri_Sa_Ye.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "settings.ini"; DestDir: "{app}"; Flags: ignoreversion
Source: "activation.lic"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.txt"; DestDir: "{app}"; Flags: ignoreversion

Source: "Docs\*"; DestDir: "{app}\Docs"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "IA\*"; DestDir: "{app}\IA"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Audio\*"; DestDir: "{app}\Audio"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Assets\*"; DestDir: "{app}\Assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\A Ki Pri Sa Yé"; Filename: "{app}\Lanceur_A_Ki_Pri_Sa_Ye.exe"
Name: "{commondesktop}\A Ki Pri Sa Yé"; Filename: "{app}\Lanceur_A_Ki_Pri_Sa_Ye.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Lanceur_A_Ki_Pri_Sa_Ye.exe"; Description: "Lancer l'application"; Flags: nowait postinstall skipifsilent

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes supplémentaires:"
