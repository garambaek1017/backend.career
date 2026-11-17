@echo off
setlocal
pushd "%~dp0" || goto folder_error
where node.exe >nul 2>&1
if errorlevel 1 goto node_error

node "%~dp0update-projects.mjs"
set "update_result=%errorlevel%"
popd
if not "%update_result%"=="0" goto update_error
echo.
echo Done. Refresh index.html in your browser.
pause
exit /b 0

:node_error
popd
echo Node.js was not found. Check that node.exe is on PATH.
pause
exit /b 1

:folder_error
echo Could not open the portfolio folder.
pause
exit /b 1

:update_error
echo The portfolio could not be updated. Check the error above.
pause
exit /b %update_result%
