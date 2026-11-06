# API 공통 규칙

모든 기능의 API가 따르는 규칙입니다. 기능별 엔드포인트와 에러 코드는 각 기능 폴더의 `api.md`에 있습니다.
Swagger(OpenAPI) 문서는 코드를 만들 때 추가합니다.

## 경로

- 버전 접두사는 두지 않고, 경로는 `POST /coupons/{couponId}/issue`처럼 씁니다.
- 회원 자신의 목록은 `/me/...` 아래에 둡니다. 회원은 토큰으로 정해서 경로에 회원 ID를 넣지 않습니다.
- 하나의 자원은 `GET /orders/{orderId}`처럼 ID로 찾습니다. 다른 회원의 자원이면 있다는 사실도 숨기려고 `404`를 응답합니다.
- 상태를 바꾸는 동작은 `POST /<자원>/{id}/<동작>` 형식이고, 예를 들면 `POST /orders/{orderId}/cancel`입니다.

| 기능 | 경로 |
|---|---|
| [인증](../features/auth/api.md) | `POST /auth/login` |
| [상품](../features/product/api.md) | `GET /brands`, `GET /products`, `GET /products/{productId}` |
| [쿠폰](../features/coupon/api.md) | `GET /coupons`, `POST /coupons/{couponId}/issue`, `GET /me/coupons` |
| [장바구니](../features/cart/api.md) | `GET /me/cart`, `POST /me/cart/items`, `PATCH /me/cart/items/{cartItemId}`, `DELETE /me/cart/items` |
| [주문](../features/order/api.md) | `POST /orders/preview`, `POST /orders`, `GET /me/orders`, `GET /orders/{orderId}`, `POST /orders/{orderId}/cancel`, `POST /orders/{orderId}/confirm` |
| [포인트](../features/point/api.md) | `GET /me/point`, `GET /me/point/history` |
| [결제](../features/payment/api.md) (3단계) | `POST /orders/{orderId}/payments` |

## 인증

- `POST /auth/login`으로 받은 JWT를 `Authorization: Bearer <token>` 헤더에 담습니다.
- 토큰 유효 시간은 1시간이고, 갱신 토큰은 만들지 않습니다 ([범위 밖](problem.md#범위-밖)).
- 로그인이 필요 없는 API는 `POST /auth/login`, `GET /brands`, `GET /products`, `GET /products/{productId}`, `GET /coupons`뿐입니다.
- 부하 테스트(k6)는 시작할 때 회원마다 토큰을 한 번 받아 두고 다시 씁니다. 요청마다 로그인하면 쿠폰 발급이 아니라 로그인 성능을 재게 됩니다.

## 멱등성

- 요청마다 새 주문이 생기기 때문에 주문 생성(`POST /orders`)에만 `Idempotency-Key` 헤더가 필수입니다.
- 같은 회원이 같은 키로 다시 요청하면 새 주문을 만들지 않고 처음 만든 주문을 그대로 응답합니다. 키는 DB `UNIQUE(member_id, idempotency_key)`로 지키고, 보관 기간은 없습니다.
- 같은 키로 내용이 다른 요청이 와도 요청 내용은 비교하지 않고 처음 주문을 응답합니다. 클라이언트는 주문 화면을 열 때마다 새 키를 만듭니다.
- 쿠폰 발급에는 키가 필요 없습니다. 1인 1매 UNIQUE 덕분에 같은 요청이 두 번 와도 두 번째는 `409 COUPON_ALREADY_ISSUED`로 끝납니다.
- 취소·구매 확정에도 키가 필요 없습니다. 상태 조건(`WHERE status = 'ORDERED'`)으로 한 번만 바뀌고, 두 번째 요청은 `409`로 끝납니다.

## 목록과 페이지

- 페이지는 커서 방식입니다. 요청은 `?cursor=<문자열>&size=<1~50, 기본 20>`, 응답은 `{ "items": [...], "nextCursor": "..." | null }` 형태입니다.
- 커서는 서버가 만든 불투명한 문자열이라 클라이언트는 해석하지 않습니다.
- 행사 중에 새 데이터가 계속 들어와서 페이지를 넘길 때 항목이 겹치거나 빠지므로, 오프셋 방식은 쓰지 않습니다.
- 예외로, 항목 수가 작고 상한이 있는 `GET /brands`, `GET /me/cart`(최대 100종)는 페이지 없이 전체를 줍니다.

## 값 형식

| 항목 | 형식 |
|---|---|
| ID | 숫자 (`number`) |
| 금액 | 원 단위 정수 |
| 시각 | ISO 8601, UTC. 예: `2026-11-11T00:00:00Z` |
| 비율 | 정수 % |

## 에러 응답 형식

```json
{ "code": "COUPON_SOLD_OUT", "message": "쿠폰이 소진되었습니다" }
```

- `code`는 `<기능>_<상황>` 형식의 대문자 스네이크 케이스입니다. 접두사는 `AUTH`, `PRODUCT`, `CART`, `COUPON`, `ORDER`, `POINT`, `PAYMENT`, `COMMON`입니다.
- 클라이언트는 `message`가 아니라 `code`로 분기합니다.
- 어떤 대상 때문에 실패했는지 알려야 하면 `details`에 담습니다. 품절된 상품이면 `{ "code": "ORDER_OUT_OF_STOCK", "message": "...", "details": { "productIds": [3] } }`처럼 보냅니다.
- 요청 형식 오류는 `400 COMMON_INVALID_REQUEST`이고, 어떤 필드가 왜 틀렸는지 `errors` 배열로 함께 보냅니다.

```json
{
  "code": "COMMON_INVALID_REQUEST",
  "message": "요청 형식이 올바르지 않습니다",
  "errors": [{ "field": "quantity", "reason": "1 이상이어야 합니다" }]
}
```

## HTTP 상태 코드

| HTTP | 쓰는 경우 | 공통 코드 |
|---|---|---|
| 200 | 조회 성공, 상태 변경 성공 | |
| 201 | 새 자원 생성 (쿠폰 발급, 주문 생성, 장바구니에 새 항목) | |
| 202 | 요청은 받았고 결과는 나중에 확정됨 (3단계 결제 승인 결과를 모를 때, 초안) | |
| 204 | 성공, 응답 본문 없음 (장바구니 빼기) | |
| 400 | 요청 형식 오류 | `COMMON_INVALID_REQUEST` |
| 401 | 토큰 없음, 잘못된 토큰, 만료 | `AUTH_UNAUTHORIZED` |
| 404 | 대상 없음, 삭제됨, 다른 회원의 자원 | 기능별 `<기능>_NOT_FOUND` |
| 409 | 지금 상태 때문에 처리할 수 없음 (소진, 중복, 품절, 기간 아님, 이미 취소됨) | 기능별 |
| 503 | 일시적 실패. 다시 시도하면 성공할 수 있음 | 기능별 `<기능>_RETRY` |
| 500 | 처리하지 못한 오류. 부하 테스트에서 0건이 목표 | `COMMON_INTERNAL_ERROR` |

`409`와 `503`은 정상적인 거절입니다. 다만 부하 테스트에서 서버 에러로 세지 않는 것은 `409`뿐이고, `503`은 따로 셉니다.

---

[이전: ERD](erd.md) | [문서 지도](../README.md) | [다음: 개발 규칙](conventions.md)
