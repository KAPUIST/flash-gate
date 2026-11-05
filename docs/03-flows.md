# 03. Flow

> **작성 전입니다.** 아래 내용은 템플릿 예시이며, 확정된 설계가 아닙니다.

Risk가 있는 케이스만 그립니다. 단순 CRUD는 그리지 않습니다.

## CASE 1-1: <예: 쿠폰 다운로드>

관련 Risk: `R1`, `R2`

```mermaid
sequenceDiagram
    actor U as User
    participant A as API
    participant R as Redis
    participant D as PostgreSQL

    U->>A: POST /coupons/{id}/issue (Idempotency-Key)
    A->>R: 중복 요청 확인
    alt 이미 처리한 요청
        A-->>U: 이전 결과 반환
    end
    A->>R: DECR 잔여 수량
    alt 잔여 < 0
        A-->>U: 409 소진됨
    else 성공
        A->>D: member_coupon INSERT
        A-->>U: 201 발급 완료
    end
```

**실패 시 처리**

- <예: DB INSERT 실패 시 Redis 수량을 INCR로 되돌린다>
- <예: 되돌리기도 실패하면 보정 배치가 맞춘다 (미검증)>

---

[← 이전: 02. ERD](02-erd.md) | [README](../README.md) | [다음: 04. API →](04-api.md)
