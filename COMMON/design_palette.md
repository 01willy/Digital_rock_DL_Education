# 디자인 팔레트 — 강사/조교용

> 본 6주 코스의 모든 PPT/figure 가 일관된 룩을 갖도록 정리.

## 색 팔레트

| 역할 | HEX | RGB | 용도 |
|------|-----|-----|------|
| Primary (강조) | `#EA851B` | (234, 133, 27) | 타이틀, 키워드, 아이콘 |
| Primary alt | `#F1801F` | (241, 128, 31) | 보조 강조 |
| Body text | `#181818` | (24, 24, 24) | 본문 (순흑색 X) |
| Secondary text | `#7A7A7A` | (122, 122, 122) | 보조 설명, 푸터 |
| Accent green | `#2E8B57` | (46, 139, 87) | "OK / 성공" 표시 |
| Accent red | `#C83A3A` | (200, 58, 58) | "주의 / 실패" 표시 |
| BG cream | `#FAF5EE` | (250, 245, 238) | 박스 배경 (Optional) |
| BG light gray | `#F6F6F6` | (246, 246, 246) | 코드/표 배경 |
| White | `#FFFFFF` | (255, 255, 255) | 메인 배경 |

## 폰트

| 용도 | 폰트 |
|------|------|
| 타이틀 | **Pretendard Black** 28~32pt, `#EA851B` |
| 부제목 | **Pretendard ExtraBold** 22~24pt, `#181818` |
| 본문 (교육용) | **Pretendard SemiBold** 22~24pt, `#181818` |
| 본문 (연구용 밀집) | **Pretendard SemiBold** 14~16pt |
| 보조 설명 | **Pretendard Medium** 14~16pt, `#7A7A7A` |
| 코드 | **JetBrains Mono** 또는 monospace 16~18pt |

## 슬라이드 패턴

- **16:9 (13.33" × 7.5")** 고정
- 좌하단 푸터: `Wk – 주제 | n/total` (`#7A7A7A`, 11pt)
- 타이틀 상단 navy 또는 cream 배너 (선택)
- 슬라이드당 메시지 **1개**, 텍스트 ≤ 50 단어
- 다이어그램/도식 > 텍스트

## matplotlib figure 설정 (jupyter notebook용)

```python
import matplotlib.pyplot as plt

plt.rcParams.update({
    'figure.dpi': 110,
    'font.family': 'Pretendard',
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'axes.labelsize': 11,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'image.cmap': 'gray',
})

ORANGE = '#EA851B'
NAVY = '#1F3A5F'
GREEN = '#2E8B57'
RED = '#C83A3A'
```
