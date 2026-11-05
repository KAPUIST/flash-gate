# 쿠폰: API

경로, 인증, 페이지, 에러 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 쿠폰 기능의 엔드포인트만 둡니다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 인증 | 시나리오 |
|---|---|---|---|---|
| GET | `/coupons` | 행사 쿠폰 목록 | 필요 없음 | 1 |
| POST | `/coupons/{couponId}/issue` | 쿠폰 발급받기 | 필요 | 2 |
| GET | `/me/coupons` | 회원 쿠폰 목록 | 필요 | 3 |

## GET /coupons

받을 수 있거나 곧 열릴 쿠폰을 보여줍니다. `ACTIVE`이고, 삭제되지 않았고, 발급 기간이 끝나지 않은 쿠폰입니다.

**요청**

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| query | cursor | | 다음 페이지 커서 |
| query | size | | 1~50, 기본 20 |

**응답** `200`

```json
{
  "items": [
    {
      "couponId": 1,
      "name": "11월 행사 10% 쿠폰",
      "scope": "ORDER",
      "discountType": "RATE",
      "discountValue": 10,
      "maxDiscountAmount": 5000,
      "minOrderAmount": 50000,
      "issueStartsAt": "2026-11-11T00:00:00Z",
      "issueEndsAt": "2026-11-11T23:59:59Z",
      "expiresAt": "2026-11-30T23:59:59Z",
      "totalQuantity": 10000,
      "remainingQuantity": 3120,
      "issueState": "OPEN",
      "targets": null
    }
  ],
  "nextCursor": null
}
```

| 필드 | 설명 |
|---|---|
| `remainingQuantity` | `max(0, 한정 수량 − Redis 발급 수)`. 대략적인 값이다. 발급 준비 전에는 한정 수량과 같다 |
| `issueState` | 계산한 값. `UPCOMING`(시작 전), `OPEN`(받을 수 있음), `SOLD_OUT`(남은 수량 0) |
| `targets` | 상품 쿠폰이면 `{ "productIds": [..], "brandIds": [..] }`, 주문 쿠폰이면 `null` (2단계) |
| `maxDiscountAmount` | 정률이면 숫자, 정액이면 `null` |

정렬은 발급 시작 시각이 빠른 순서입니다. 목록 응답은 서버에서 1초 캐시합니다 (가정).

**에러**

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | `COMMON_INVALID_REQUEST` | `size`가 범위 밖, 커서가 잘못됨 | |

## POST /coupons/{couponId}/issue

회원에게 회원 쿠폰 한 장을 발급합니다. 화면 버튼 문구는 "쿠폰 받기"입니다.

**요청**

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| header | Authorization | O | `Bearer <token>` |
| path | couponId | O | 쿠폰 ID |

요청 body는 없습니다.

**`Idempotency-Key`가 필요 없는 이유**: 1인 1매라서 같은 회원이 같은 쿠폰을 두 번 요청하면 두 번째는 항상 `409 COUPON_ALREADY_ISSUED`로 끝납니다. 요청을 몇 번 보내도 결과는 회원 쿠폰 한 장입니다. 클라이언트는 연결이 끊겨 결과를 모르면 그냥 다시 보내면 됩니다.

**응답** `201`

```json
{
  "memberCouponId": 52013,
  "couponId": 1,
  "status": "ISSUED",
  "issuedAt": "2026-11-11T00:00:01.203Z",
  "expiresAt": "2026-11-30T23:59:59Z"
}
```

**에러** (확인 순서대로)

| 순서 | HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|---|
| - | 401 | `AUTH_UNAUTHORIZED` | 토큰 없음, 잘못됨, 만료 | |
| 1 | 404 | `COUPON_NOT_FOUND` | 쿠폰이 없거나 삭제됨 | |
| 2 | 409 | `COUPON_ISSUE_STOPPED` | 발급 중단된 쿠폰 | |
| 3 | 409 | `COUPON_NOT_STARTED` | 발급 시작 전 | |
| 4 | 409 | `COUPON_ISSUE_ENDED` | 발급 기간 끝남 | |
| 5 | 409 | `COUPON_ALREADY_ISSUED` | 이미 받음 (Redis SADD 0, 또는 DB UNIQUE 위반) | R2 |
| 6 | 409 | `COUPON_SOLD_OUT` | 한정 수량을 다 씀 | R1 |
| 7 | 503 | `COUPON_RETRY` | Redis 오류 또는 저장 실패. 수량을 되돌렸으니 다시 시도 | R3 |

- 부하 테스트에서 `409`는 정상 응답으로 셉니다. `503`은 따로 셉니다. `500`은 0건이 목표입니다 (`R4`).
- `COUPON_ALREADY_ISSUED`와 `COUPON_SOLD_OUT`이 함께 해당되면 이미 받음이 먼저입니다. 이미 받은 회원에게 소진을 알려줄 필요가 없습니다.

## GET /me/coupons

내 회원 쿠폰을 최근에 받은 순서로 보여줍니다.

**요청**

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| header | Authorization | O | `Bearer <token>` |
| query | status | | `usable`, `used`, `expired`. 없으면 전체 |
| query | cursor | | 다음 페이지 커서 |
| query | size | | 1~50, 기본 20 |

**응답** `200`

```json
{
  "items": [
    {
      "memberCouponId": 52013,
      "state": "USABLE",
      "issuedAt": "2026-11-11T00:00:01.203Z",
      "usedAt": null,
      "coupon": {
        "couponId": 1,
        "name": "11월 행사 10% 쿠폰",
        "scope": "ORDER",
        "discountType": "RATE",
        "discountValue": 10,
        "maxDiscountAmount": 5000,
        "minOrderAmount": 50000,
        "expiresAt": "2026-11-30T23:59:59Z"
      }
    }
  ],
  "nextCursor": "eyJpc3N1ZWRBdCI6Ii4uLiIsImlkIjo1MjAxM30"
}
```

| 필드 | 설명 |
|---|---|
| `state` | 계산한 값. `USABLE`(사용 가능), `USED`(사용함), `EXPIRED`(만료). 저장된 `status`는 `ISSUED`, `USED` 두 가지뿐이다 |
| `usedAt` | 사용함이면 시각, 아니면 `null` (2단계) |

**에러**

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | `COMMON_INVALID_REQUEST` | `status`, `size`, 커서가 잘못됨 | |
| 401 | `AUTH_UNAUTHORIZED` | 토큰 없음, 잘못됨, 만료 | |

## 에러 코드 모음

| 코드 | HTTP | 엔드포인트 |
|---|---|---|
| `COUPON_NOT_FOUND` | 404 | issue |
| `COUPON_ISSUE_STOPPED` | 409 | issue |
| `COUPON_NOT_STARTED` | 409 | issue |
| `COUPON_ISSUE_ENDED` | 409 | issue |
| `COUPON_ALREADY_ISSUED` | 409 | issue |
| `COUPON_SOLD_OUT` | 409 | issue |
| `COUPON_RETRY` | 503 | issue |

주문에서 회원 쿠폰을 쓸 때 나는 에러(이미 사용, 만료, 대상 아님, 최소 금액 미달)는 [주문 API](../order/api.md)에 있습니다.

---

[← 이전: Flow](flows.md) | [문서 지도](../../README.md)
