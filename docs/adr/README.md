# ADR (결정 기록)

되돌리기 어려워서 다른 선택지와 비교해 고른 결정과 그 이유를 기록합니다.

| 번호 | 결정 | 상태 | 관련 Risk |
|---|---|---|---|
| [0001](0001-redis-decides-coupon-issue.md) | 쿠폰 발급은 Redis가 결정하고, DB는 기록만 한다 | 채택 | R1, R3, R4, R5 |
| [0002](0002-modular-monolith-with-one-port.md) | 모듈러 모놀리스로 만들고, 포트는 발급 전략 하나만 둔다 | 채택 | |

---

[문서 지도](../README.md) | [README 결과 표](../../README.md#2-결과) | [실험 목록](../experiments/)
