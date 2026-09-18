@echo off
start "105 Zebrafish Website" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\32198\Documents\Codex\2026-09-17\zebrafish-recovery\work\keep-zebrafish-online.ps1"
echo The website service and public tunnel are starting in the background.
echo Check the tunnel URL in the runtime log after a few seconds:
echo %~dp0data\public-runtime\tunnel.log
