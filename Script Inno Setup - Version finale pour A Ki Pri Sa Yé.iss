;; Script Inno Setup - Version finale pour A Ki Pri Sa Yé
[Setup]
AppName=A Ki Pri Sa Yé
AppVersion=1.0.0
DefaultDirName=C:\A Ki Pri Sa Yé
DefaultGroupName=A Ki Pri Sa Yé
UninstallDisplayIcon={app}\akiprisaye.exe
OutputDir=.
OutputBaseFilename=Setup_A_Ki_Pri_Sa_Ye_Final
Compression=lzma
SolidCompression=yes
SetupIconFile=Assets\akiprisaye.ico
WizardSmallImageFile=Assets\wizard_small.bmp
WizardImageFile=Assets\wizard.bmp
WizardImageBackColor=clWhite
DisableDirPage=no
LicenseFile=Docs\Notice_Utilisateur.txt
MinVersion=10.0
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "akiprisaye.exe";              DestDir: "{app}"; Flags: ignoreversion
Source: "settings.ini";                DestDir: "{app}"; Flags: ignoreversion
Source: "activation.lic";              DestDir: "{app}"; Flags: ignoreversion
Source: "README.txt";                  DestDir: "{app}"; Flags: ignoreversion
Source: "Docs\*";                     DestDir: "{app}\Docs";   Flags: recursesubdirs createallsubdirs ignoreversion
Source: "Assets\*";                   DestDir: "{app}\Assets"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "Audio\*";                    DestDir: "{app}\Audio";  Flags: recursesubdirs createallsubdirs ignoreversion
Source: "IA\*";                       DestDir: "{app}\IA";     Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{group}\A Ki Pri Sa Yé";       Filename: "{app}\akiprisaye.exe"
Name: "{commondesktop}\A Ki Pri Sa Yé"; Filename: "{app}\akiprisaye.exe"; Tasks: desktopicon


[Run]
; (plus rien ici)



[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes supplémentaires:"
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

[Setup]
