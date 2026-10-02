@echo off
chcp 65001 > nul
title 크리에이터 데일리 스튜디오 - GitHub Pages 배포
echo ========================================================
echo   🚀 크리에이터 데일리 스튜디오를 GitHub Pages에 배포합니다...
echo ========================================================
call npm run build
if %errorlevel% neq 0 (
    echo 빌드 중 오류가 발생했습니다.
    pause
    exit /b %errorlevel%
)
type nul > dist\.nojekyll
cd dist
git init
git checkout -b gh-pages
git add -A
git commit -m "deploy: GitHub Pages 배포"
git remote add origin https://github.com/beanhullrom-netizen/youtube.git
git push -f origin gh-pages
cd ..
rmdir /s /q dist\.git
echo ========================================================
echo   ✅ 배포가 성공적으로 완료되었습니다!
echo   접속 주소: https://beanhullrom-netizen.github.io/youtube/
echo ========================================================
pause
