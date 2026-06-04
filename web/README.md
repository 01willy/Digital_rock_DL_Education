# web/ — 학생 학습 UI

> 본 폴더는 **Claude 디자인 의뢰 결과물(학생 학습 UI prototype)** 이 들어갈 자리입니다.

## 현재 상태

- 의뢰 진행 중 — `_for_claude_design/digital_rock_design_brief.zip` 으로 디자인 요청 전송
- Claude 디자인 결과물 수령 후 본 폴더에 배치

## 예상 구조 (Claude 디자인 결과에 따라 변경 가능)

```
web/
├── index.html          ← 학습 대시보드 메인
├── group1/             ← 1조용 페이지
├── group2/             ← 2조용 페이지
├── week1.html, ...     ← 주차별 페이지
├── components/         ← 인터랙티브 위젯 (voxel viewer, sparse slider, ...)
├── assets/             ← 폰트, 이미지
├── data/               ← 정적 데이터 (.bin 또는 JSON 변환본)
└── package.json        ← (React/Vue 사용 시)
```

## 배포 환경

- **정적 사이트 호스팅** (GitHub Pages 또는 Vercel)
- 백엔드 서버 없음
- 학생 진도/답안 저장은 `localStorage`
- 데이터는 fetch로 정적 파일 로드

## 호스팅 옵션

| 옵션 | 빌드/배포 |
|------|-----------|
| **Vercel** (권장) | repo 연결 → `git push` 시 자동 배포 |
| **GitHub Pages** | `docs/` 폴더 또는 gh-pages branch |

Vercel 설정 예시 (`vercel.json`):
```json
{
  "buildCommand": "...",
  "outputDirectory": "...",
  "framework": null
}
```
