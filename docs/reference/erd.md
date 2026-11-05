# ERD

> **작성 전입니다.** 아래 내용은 템플릿 예시이며, 확정된 설계가 아닙니다.

테이블은 여러 기능이 같이 쓰기 때문에 ERD는 여기 한 곳에만 둡니다. 기능 문서에서는 이 문서를 링크합니다.

```mermaid
erDiagram
    MEMBER ||--o{ MEMBER_COUPON : downloads
    COUPON ||--o{ MEMBER_COUPON : issued_as

    MEMBER {
        bigint id PK
        varchar email UK
    }
    COUPON {
        bigint id PK
        int total_quantity
        int issued_quantity
        datetime starts_at
    }
    MEMBER_COUPON {
        bigint id PK
        bigint member_id FK
        bigint coupon_id FK
        varchar status
    }
```

## 제약 조건과 인덱스

ERD에서 보이지 않는 결정을 적습니다. 정합성을 DB가 지키는지, 애플리케이션이 지키는지 구분합니다.

| 테이블 | 제약/인덱스 | 이유 | 관련 Risk |
|---|---|---|---|
| member_coupon | UNIQUE(member_id, coupon_id) | <예: 중복 발급을 DB에서 최종 차단> | R2 |
| coupon | <예: CHECK issued ≤ total> | | R1 |

## 테이블을 쓰는 기능

| 테이블 | 쓰는 기능 |
|---|---|
| member | [쿠폰](../features/coupon/) |
| coupon | [쿠폰](../features/coupon/) |
| member_coupon | [쿠폰](../features/coupon/) |

## 상태 값

| 테이블.컬럼 | 값 | 전이 |
|---|---|---|
| member_coupon.status | ISSUED, USED, EXPIRED | ISSUED → USED, ISSUED → EXPIRED |

---

[← 이전: 문제 정의](problem.md) | [문서 지도](../README.md) | [다음: API 공통 규칙 →](api.md)
