@echo off
cd /d "%~dp0"
py main.py

if errorlevel 1 (
    echo.
    echo Aplikasi belum dapat dijalankan. Pastikan Python sudah terpasang.
    pause
)
