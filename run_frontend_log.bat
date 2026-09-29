@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\nobel\AppData\Roaming\npm;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%"
cd /d "%~dp0TMS"
npm run dev > "%~dp0frontend.log" 2>&1
