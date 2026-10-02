# 🎬 크리에이터 데일리 스튜디오 (Creator Daily Studio)

구독자 증감, 일일 조회수, 구독 전환율 및 그날의 일기와 컨디션을 한눈에 기록하고 분석하는 크리에이터 맞춤형 스튜디오 대시보드입니다.

🌐 **실시간 웹 데모 (GitHub Pages):**  
👉 [https://beanhullrom-netizen.github.io/youtube/](https://beanhullrom-netizen.github.io/youtube/)

---

## 📌 주요 기능
- 📊 **핵심 지표(KPI) 및 성장 트렌드**: 일일 조회수, 순 구독자 증감, 시청 시간 등 직관적 대시보드
- 📝 **크리에이터 데일리 저널**: 작업 일기, 목표 달성 기록, 컨디션 및 감정 캘린더
- 🎯 **목표 달성 트래커**: 10만 구독자 등 마일스톤 달성 시 축하 연출 및 분석 리포트
- ⚡ **유튜브 분석 연동**: YouTube Data API 및 샘플 데이터 모드 지원

---

## 💻 로컬 실행 방법

**사전 준비:** Node.js 설치

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **환경 변수 설정 (선택):**
   필요 시 `.env.local` 파일에 API 키를 설정합니다.

3. **로컬 개발 서버 실행:**
   ```bash
   npm run dev
   ```
   또는 폴더 내의 `스튜디오_실행.bat`을 더블 클릭하면 자동으로 브라우저(`http://localhost:3000`)가 열립니다.

---

## 🚀 GitHub Pages 배포 방법

프로젝트 폴더 내의 **`배포하기.bat`** 파일을 더블 클릭하거나 아래 명령어를 실행하면 최신 빌드가 GitHub Pages로 자동 배포됩니다.

```bash
npm run build
```
배포 후 수 분 내에 [https://beanhullrom-netizen.github.io/youtube/](https://beanhullrom-netizen.github.io/youtube/) 에 반영됩니다.
