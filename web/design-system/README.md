# Digital Rock — Deck Design System

교육 패키지의 **웹 deck(슬라이드) 디자인 시스템**을 컴포넌트 라이브러리로 정리한 것입니다.
`claude.ai/design` 으로 올려(`/design-sync`) 시각적으로 다듬은 뒤 다시 내려받는 워크플로를 위한 폴더입니다.

## 무엇이 들어있나

- **`styles/deck.css`** — 단일 진실원(토큰 + 컴포넌트 스타일). 색·타이포·간격 토큰은 `:root` 변수로,
  컴포넌트 스타일은 그 아래에 정의. (원본 `../deck/deck.css` + 슬라이드에 inline 이던 스타일을 승격한 superset)
- **`foundations/`** — 색 토큰(`colors.html`), 타이포그래피(`typography.html`)
- **`slides/`** — 슬라이드 프레임: `cover` · `content-slide` · `section-divider` (1920×1080)
- **`components/`** — `cards` · `callouts` · `chips-badges` · `bullet-list` · `code-equation` · `comparison-table` · `roadmap`
- **`diagrams/`** — SVG 다이어그램: `unet` · `convolution` · `gradient-descent` · `skip-connection`

각 프리뷰 HTML은 **첫 줄에 `<!-- @dsCard group="…" name="…" -->`** 마커가 있어 Design System 패널의 카드로 인식됩니다.
모든 프리뷰는 `../styles/deck.css` 하나만 링크하므로 자체 완결적입니다(폰트는 CDN).

## claude.ai/design 로 올리기 (`/design-sync`)

```bash
cd web/design-system     # ← 이 폴더
claude                   # Claude Code 실행
```
그런 다음 Claude Code 안에서:
```
/design-sync
```
- 첫 실행 시 claude.ai 로그인에 **design-system 접근 권한**을 추가하라는 프롬프트가 한 번 뜹니다.
- 올릴 design 프로젝트를 고르거나 새로 만들고, **업로드 계획(plan)을 검토·승인**하면 컴포넌트가 올라갑니다.
- 한 번에 통째로 교체가 아니라 **컴포넌트 하나씩 점진적**으로 동기화됩니다.
- claude.ai/design 에서 다듬은 변경은 다시 `/design-sync` 로 동기화해 내려받습니다.

## 개선 후 본 사이트에 반영하려면

claude.ai/design 에서 토큰/컴포넌트를 개선했다면, 핵심 변경(`styles/deck.css` 의 토큰·컴포넌트 규칙)을
`../deck/deck.css` 로 반영하면 실제 W2 deck(`../W2_deck.html`)·primer(`../W2_unet_primer.html`)에 적용됩니다.
(이 라이브러리의 `deck.css` 는 deck 의 superset이므로, 공통 규칙만 골라 역반영하세요.)
