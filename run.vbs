Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Папка со скриптом
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Команда запуска Node.js с правильной директорией
cmd = "cmd /c cd /d """ & scriptDir & """ && node server.js"

' Запуск сервера в фоне
WshShell.Run cmd, 0, False

' Ждём запуск сервера (лучше 4–5 сек)
WScript.Sleep 5000

' Открываем сайт
WshShell.Run "http://localhost:3000"

Set WshShell = Nothing
Set fso = Nothing
