# 실험 기록

Risk마다 최소 한 번 깨뜨리고, 고치고, 다시 잽니다.

| 번호 | 실험 | 관련 Risk | Before / After |
|---|---|---|---|
| - | 아직 없음 | | |

## 실험 계획

아직 하나도 하지 않았습니다. 번호는 실험을 실제로 할 때 붙이고, 아래는 순서만 정한 계획입니다.

| 순서 | 실험 | 관련 Risk | 비교할 구현 | 볼 숫자 | 범위 |
|---|---|---|---|---|---|
| 1 | 로컬 기준선 | 전체 | 빈 응답, DB 조회 1번, Redis 명령 1번 | 최대 RPS, p99. 이후 실험의 천장 | 쿠폰 발급 |
| 2 | 쿠폰 초과 발급 재현과 해결 | 초과 발급 | `CountThenInsertIssuance` (Before, 잠금 없이 COUNT 후 INSERT) / `PessimisticLockIssuance` (쿠폰 행 `FOR UPDATE`) / `RedisFirstIssuance` | 회원 쿠폰 수 − 한정 수량 | 쿠폰 발급 |
| 3 | 쿠폰 발급 응답 시간 | 발급 지연·에러 | `PessimisticLockIssuance` / `RedisFirstIssuance` ([ADR-0001](../adr/0001-redis-decides-coupon-issue.md) 검증) | 3,000 RPS에서 p99, 5xx 수 | 쿠폰 발급 |
| 4 | 중간 실패와 Redis 재시작 | 발급 수 불일치, Redis 재시작 | 저장 직전 서버 종료, Redis 재시작 후 복구 있음·없음 | Redis 수 − 회원 쿠폰 수, 초과 발급 수 | 쿠폰 발급 |
| 5 | Lua로 명령 묶기 | 발급 수 불일치, 발급 지연·에러 | SADD + INCR 두 번 / Lua 한 번 | 처리량, 어긋남 수. 참고 사례의 "Lua 약 21% 느림" 확인 | 쿠폰 발급 |
| 6 | 재고 초과 판매 | 초과 판매 | `findOne` 후 `save` (Before) / 조건부 UPDATE / 비관적 락 / 낙관적 락 + 재시도 / Redis | 판매 수량 − 처음 재고, p99, 재시도 수 | 주문 |
| 7 | 여러 상품 주문 데드락 | 주문 데드락 | 상품 순서 그대로 잠금 (Before) / 상품 ID 순서로 잠금 | 데드락 에러 수 | 주문 |
| 8 | 쿠폰 이중 사용 | 쿠폰 이중 사용 | 읽고 나서 UPDATE (Before) / 조건부 UPDATE | 취소되지 않은 주문 두 개에 쓰인 회원 쿠폰 수 | 주문 |
| 9 | 같은 멱등 키 동시 요청 | 중복 주문 | 키 확인 후 INSERT (Before) / UNIQUE 제약 | 같은 키의 주문 수 | 주문 |
| 10 | 포인트 동시 사용 | 포인트 이중 사용 | 읽고 나서 UPDATE (Before) / 조건부 UPDATE | 잔액 < 0 시도 수, 잔액 = 내역 합 여부 | 주문 |
| 11 | 포인트 적립 메시지 중복 | 포인트 이중 적립 | UNIQUE 없음 (Before) / `UNIQUE(order_id, type)` | 주문당 적립 내역 수 | 결제 |
| 12 | 결제 장애 주입 | 결제 보상 실패, 결제 결과 모름 | Mock PG 거절·지연·응답 없음 | 결제 승인됐는데 주문이 끝나지 않은 건수 | 결제 |

같은 회원 중복 요청(409로 끝나는지)과 금액 불일치는 부하 실험이 아니라 동시성 테스트와 단위 테스트로 증명합니다.

---

[문서 지도](../README.md) | [README 결과 표](../../README.md#2-결과) | [ADR 목록](../adr/)
