@echo off

echo Connecting to server...

ssh smarthubf@smart-hub-f.geexar.dev "cd public_html && nvm use 22 && git pull origin develop && yarn && yarn build"

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ===== Deploy SUCCESS =====
) ELSE (
    echo.
    echo ===== Deploy FAILED =====
)

pause