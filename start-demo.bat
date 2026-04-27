@echo off
echo Starting AEM Author...
start "AEM Author" java -Xmx4g -jar C:\AEM\author-2026\aem-author-p4502.jar -p 4502 -nofork

echo Waiting 3 minutes for AEM to start...
timeout /t 180

echo Starting ngrok tunnel...
start "ngrok" ngrok http 4502 --domain=untimely-rejoice-septum.ngrok-free.dev

echo.
echo AEM Author:  http://localhost:4502
echo Tunnel URL:  https://untimely-rejoice-septum.ngrok-free.dev
echo Vercel app:  https://aem-headless-nextjs.vercel.app/
echo.
echo Press any key when done with demo to stop...
pause

echo Stopping ngrok...
taskkill /f /im ngrok.exe
echo Done. AEM will continue running until you close its window.
