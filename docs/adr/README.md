# ADR (결정 기록)

되돌리기 어려워서 다른 선택지와 비교해 고른 결정과 그 이유를 기록합니다.

| 결정 | 상태 | 관련 Risk |
|---|---|---|
| [쿠폰 발급은 Redis가 결정하고, DB는 기록만 한다](0001-redis-decides-coupon-issue.md) | 채택 | 초과 발급, 발급 수 불일치, 발급 지연·에러, Redis 재시작 |
| [모듈러 모놀리스로 만들고, 포트는 발급 전략 하나만 둔다](0002-modular-monolith-with-one-port.md) | 채택. 포트 수는 이벤트 결정이 고침 | |
| [모듈 사이 반응은 이벤트로 하고, 전달 방식은 프로세스 안에서 outbox, Kafka 순으로 키운다](0003-module-reactions-through-events.md) | 채택 | 포인트 적립 누락, 포인트 이중 적립 |

---

[문서 지도](../README.md) | [README 결과 표](../../README.md#2-결과) | [실험 목록](../experiments/)
