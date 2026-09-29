@echo off
set "JAVA_HOME=C:\Program Files\java\jdk-17"
set "PATH=C:\Program Files\java\jdk-17\bin;C:\Program Files\nodejs;C:\Users\nobel\AppData\Roaming\npm;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%"

echo ===================================================
echo   Starting TransFlow TMS (Frontend + Backend)
echo ===================================================

echo [1/2] Starting Spring Boot Backend (Port 8080)...
start "TMS Backend (Port 8080)" cmd /k "cd /d %~dp0tms-backend && mvnw.cmd spring-boot:run"

echo [2/2] Starting Next.js Frontend (Port 3000)...
start "TMS Frontend (Port 3000)" cmd /k "cd /d %~dp0TMS && npm run dev"

echo.
echo ===================================================
echo   TransFlow TMS is launching!
echo   - Frontend: http://localhost:3000
echo   - Swagger API Docs: http://localhost:8080/swagger-ui/index.html
echo ===================================================
timeout /t 5 >nul 2>&1 || ping 127.0.0.1 -n 6 >nul
start http://localhost:3000
