@echo off
echo ================================================================
echo  Phase 3A Demo Start — Multi-CMS Knowledge Hub
echo ================================================================
echo.

echo [1/4] Starting WordPress (Docker)...
docker compose -f docker\wordpress\docker-compose.yml up -d
echo.

echo [2/4] Starting AEM Author (wait ~3 min for cold start)...
set AEM_JAR=C:\path\to\aem-author-p4502.jar
if not exist "%AEM_JAR%" (
  echo  WARNING: AEM JAR not found at %AEM_JAR%
  echo  Edit AEM_JAR path in this script, or skip if AEM is already running.
) else (
  start "AEM Author" java -Xmx4g -Xms2g -XX:MaxMetaspaceSize=512m ^
    -jar "%AEM_JAR%" -p 4502 -nofork
  echo  Waiting 3 minutes for AEM cold start...
  timeout /t 180 /nobreak
)
echo.

echo [3/4] Starting ngrok tunnel for AEM Author...
start "ngrok" ngrok http 4502 --domain=untimely-rejoice-septum.ngrok-free.dev
echo.

echo [4/4] Ready.
echo.
echo   AEM Author  : http://localhost:4502
echo   WordPress   : http://localhost:8080
echo   WP Admin    : http://localhost:8080/wp-admin
echo   ngrok       : https://untimely-rejoice-septum.ngrok-free.dev
echo   Vercel app  : https://aem-headless-nextjs.vercel.app/
echo.
echo Press any key to stop all services and exit...
pause > nul

echo.
echo Stopping services...
taskkill /f /im ngrok.exe 2>nul
docker compose -f docker\wordpress\docker-compose.yml stop
echo Done.
