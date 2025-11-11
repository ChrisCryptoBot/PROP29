@echo off
echo Clearing all caches for PROPER 2.9...

echo.
echo Stopping any running development servers...
taskkill /f /im node.exe 2>nul

echo.
echo Clearing npm cache...
npm cache clean --force

echo.
echo Clearing yarn cache...
yarn cache clean

echo.
echo Removing node_modules...
rmdir /s /q node_modules 2>nul

echo.
echo Removing package-lock.json and yarn.lock...
del package-lock.json 2>nul
del yarn.lock 2>nul

echo.
echo Clearing build artifacts...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q .cache 2>nul

echo.
echo Clearing React/Vite specific cache...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q node_modules\.vite 2>nul

echo.
echo Reinstalling dependencies...
npm install

echo.
echo Cache cleared successfully!
echo.
echo To start the development server, run:
echo npm start
echo.
pause 