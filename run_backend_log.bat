@echo off
set "JAVA_HOME=C:\Program Files\java\jdk-17"
set "PATH=C:\Program Files\java\jdk-17\bin;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%"
cd /d "%~dp0tms-backend"
call mvnw.cmd spring-boot:run > "%~dp0backend.log" 2>&1
