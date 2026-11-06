# 주문: API

인증, 멱등성, 목록, 에러 응답 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 주문 기능의 엔드포인트만 둡니다.
모든 엔드포인트는 로그인이 필요합니다 (`Authorization: Bearer <token>`).

## 엔드포인트

| 메서드 | 경로 | 설명 | 멱등 | 시나리오 |
|---|---|---|---|---|
| POST | /orders/preview | 주문서 보기, 금액 미리 보기. 저장하지 않음 | 조회라서 멱등 | [주문서 보기](README.md#시나리오-1-주문서-보기), [금액 미리 보기](README.md#시나리오-2-쿠폰과-포인트를-골라-금액-미리-보기) |
| POST | /orders | 주문하기 | `Idempotency-Key` 필수 | [주문하기](README.md#시나리오-3-주문하기), [같은 주문을 두 번 보냄](README.md#시나리오-4-같은-주문을-두-번-보냄) |
| GET | /me/orders | 내 주문 목록 | 조회 | [내 주문 목록·상세 보기](README.md#시나리오-5-내-주문-목록상세-보기) |
| GET | /orders/{orderId} | 주문 상세 | 조회 | [내 주문 목록·상세 보기](README.md#시나리오-5-내-주문-목록상세-보기) |
| POST | /orders/{orderId}/cancel | 주문 취소 | 상태 조건으로 한 번만 바뀜 | [주문 취소](README.md#시나리오-6-주문-취소) |
| POST | /orders/{orderId}/confirm | 구매 확정 | 상태 조건으로 한 번만 바뀜 | [구매 확정](README.md#시나리오-7-구매-확정) |

[자동 구매 확정](README.md#시나리오-8-시스템-자동-구매-확정)은 배치라서 API가 없습니다.

## 이 API가 응답하는 에러 코드

주문 API는 주문 모듈이 판단한 실패를 `ORDER_` 코드로 응답합니다. 쿠폰을 쓸 수 없는 이유는 주문 모듈이 쿠폰 모듈의 결과를 보고 판단하므로 `ORDER_COUPON_UNAVAILABLE` 하나로 응답합니다.
포인트는 예외입니다. 포인트 규칙과 잔액은 포인트 모듈만 알아서 포인트 모듈이 낸 코드(`POINT_BELOW_MINIMUM_USE`, `POINT_EXCEEDS_LIMIT`, `POINT_INSUFFICIENT`)를 그대로 응답합니다.
`ORDER_OUT_OF_STOCK`과 `ORDER_PRODUCT_UNAVAILABLE`은 `details.productIds`에 해당 상품 ID를 담습니다 ([에러 응답 형식](../../reference/api.md#에러-응답-형식)).

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | `COMMON_INVALID_REQUEST` | 요청 형식 오류. 아래 "요청 검사" 참고 | |
| 401 | `AUTH_UNAUTHORIZED` | 토큰 없음, 잘못된 토큰, 만료 | |
| 404 | `ORDER_NOT_FOUND` | 주문이 없거나 다른 회원의 주문 | |
| 404 | `ORDER_CART_ITEM_NOT_FOUND` | 장바구니 항목이 없거나 다른 회원의 항목 | |
| 404 | `ORDER_PRODUCT_NOT_FOUND` | 없는 상품 ID | |
| 409 | `ORDER_AMOUNT_CHANGED` | 지금 가격으로 계산한 결제 금액이 화면에서 본 금액과 다름 | |
| 409 | `ORDER_PRODUCT_UNAVAILABLE` | 판매 중지되었거나 삭제된 상품이 있음 | |
| 409 | `ORDER_OUT_OF_STOCK` | 재고가 모자란 상품이 있음 | 초과 판매 |
| 409 | `ORDER_COUPON_UNAVAILABLE` | 고른 쿠폰을 쓸 수 없음 (이미 사용, 만료, 대상 아님, 최소 주문 금액 미달, 다른 회원의 쿠폰, 쿠폰 종류가 맞지 않음) | 쿠폰 이중 사용 |
| 409 | `POINT_BELOW_MINIMUM_USE` | 쓸 포인트가 5,000 미만 (포인트 모듈이 냄) | |
| 409 | `POINT_EXCEEDS_LIMIT` | 쓸 포인트가 쿠폰 할인 뒤 금액의 10%를 넘음 (포인트 모듈이 냄) | |
| 409 | `POINT_INSUFFICIENT` | 포인트 잔액 부족 (포인트 모듈이 냄) | 포인트 이중 사용 |
| 409 | `ORDER_NOT_CANCELABLE` | 이미 취소되었거나 구매 확정된 주문 | |
| 409 | `ORDER_NOT_CONFIRMABLE` | 이미 취소되었거나 구매 확정된 주문 | |
| 503 | `ORDER_RETRY` | 일시적 DB 실패(데드락, 잠금 대기 시간 초과, 연결 오류 등). 다시 시도하면 성공할 수 있음 | 주문 데드락 |
| 500 | `COMMON_INTERNAL_ERROR` | 주문 합계와 상품별 합계가 다름 (버그) | 금액 불일치 |

## 요청 검사

`POST /orders/preview`와 `POST /orders`가 같은 검사를 합니다. 어기면 `400 COMMON_INVALID_REQUEST`로 응답하고 `errors`에 필드와 이유를 담습니다.

| 필드 | 규칙 |
|---|---|
| `cartItemIds`, `items` | 둘 중 꼭 하나만 |
| `items` | 1~20개 (가정). 같은 `productId`가 두 번 나오면 안 됨 |
| `items[].quantity` | 1~99 정수 |
| `cartItemIds` | 1~20개. 중복 없음 |
| `productCoupons[].productId` | 주문에 들어 있는 상품이어야 함. 상품마다 최대 1개 |
| `memberCouponId` | `productCoupons`와 `orderMemberCouponId`를 통틀어 중복 없음 |
| `pointAmount` | 0 이상 정수. 0이면 포인트를 쓰지 않음 |
| `expectedPaymentAmount` | `POST /orders`에서 필수. 0 이상 정수 |
| `Idempotency-Key` 헤더 | `POST /orders`에서 필수. 1~64자. UUID를 권장 |

## POST /orders/preview

주문서와 금액 미리 보기입니다. 고른 쿠폰과 포인트가 없으면 주문서 보기, 있으면 금액 미리 보기입니다.
아무것도 저장하지 않고, 재고와 쿠폰을 잡아 두지 않습니다. 고른 쿠폰이나 포인트를 쓸 수 없어도 409를 내지 않고, 이유를 응답에 담아 계산에서 뺍니다.

#### 요청

```json
{
  "items": [
    { "productId": 11, "quantity": 1 },
    { "productId": 12, "quantity": 3 },
    { "productId": 13, "quantity": 2 }
  ],
  "productCoupons": [
    { "productId": 11, "memberCouponId": 101 },
    { "productId": 13, "memberCouponId": 102 }
  ],
  "orderMemberCouponId": 103,
  "pointAmount": 7000
}
```

장바구니에서 오면 `items` 대신 `"cartItemIds": [31, 32, 33]`를 보내고, 수량은 장바구니에 담긴 수량입니다.

#### 응답 200

[README의 계산 예시](README.md#계산-예시)와 같은 값입니다.

```json
{
  "orderable": true,
  "items": [
    {
      "productId": 11,
      "productName": "러닝화",
      "brandName": "나이키",
      "unitPrice": 59000,
      "quantity": 1,
      "amount": 59000,
      "orderable": true,
      "unavailableReason": null,
      "usableProductCoupons": [
        {
          "memberCouponId": 101,
          "couponName": "나이키 10% 할인",
          "discountType": "RATE",
          "discountValue": 10,
          "maxDiscountAmount": 5000,
          "minOrderAmount": 30000,
          "expiresAt": "2026-11-30T14:59:59Z",
          "expectedDiscountAmount": 5000
        }
      ],
      "productDiscountAmount": 5000,
      "orderDiscountAmount": 4910,
      "pointAmount": 3438,
      "paymentAmount": 45652
    }
  ],
  "usableOrderCoupons": [
    {
      "memberCouponId": 103,
      "couponName": "10만 원 이상 1만 원 할인",
      "discountType": "FIXED",
      "discountValue": 10000,
      "maxDiscountAmount": null,
      "minOrderAmount": 100000,
      "expiresAt": "2026-11-30T14:59:59Z",
      "expectedDiscountAmount": 10000
    }
  ],
  "selectedCoupons": [
    { "memberCouponId": 101, "applied": true, "reason": null },
    { "memberCouponId": 102, "applied": true, "reason": null },
    { "memberCouponId": 103, "applied": true, "reason": null }
  ],
  "point": {
    "balance": 12000,
    "minUsable": 5000,
    "maxUsable": 10000,
    "requested": 7000,
    "applied": 7000,
    "reason": null
  },
  "productAmount": 118000,
  "discountAmount": 18000,
  "pointAmount": 7000,
  "paymentAmount": 93000
}
```

`items`는 첫 상품만 보였고, 나머지 두 상품도 같은 모양입니다.

| 필드 | 값 |
|---|---|
| `orderable` | 모든 상품을 주문할 수 있으면 `true` |
| `items[].unavailableReason` | `OUT_OF_STOCK`(품절), `STOPPED`(판매 중지), `DELETED`(삭제), 또는 `null` |
| `selectedCoupons[].reason` | `EXPIRED`, `ALREADY_USED`, `NOT_TARGET`, `MIN_ORDER_AMOUNT_NOT_MET`, `NOT_OWNED`, `SCOPE_MISMATCH`, 또는 `null` |
| `point.reason` | `BELOW_MINIMUM`(5,000 미만), `OVER_LIMIT`(10% 초과), `INSUFFICIENT_BALANCE`(잔액 부족), `NOT_AVAILABLE`(쿠폰 할인 뒤 금액이 50,000원 미만이라 쓸 수 없음), 또는 `null` |
| `point.maxUsable` | min(쿠폰 할인 뒤 금액의 10% 버림, 잔액). 5,000 미만이면 0 |
| `expectedDiscountAmount` | 그 쿠폰만 골랐을 때의 할인. 주문 쿠폰은 지금 고른 상품 쿠폰을 적용한 뒤 기준 |

#### 에러

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | `COMMON_INVALID_REQUEST` | [요청 검사](#요청-검사) 위반 |
| 401 | `AUTH_UNAUTHORIZED` | 토큰 문제 |
| 404 | `ORDER_CART_ITEM_NOT_FOUND` | 장바구니 항목이 없거나 다른 회원의 항목 |
| 404 | `ORDER_PRODUCT_NOT_FOUND` | 없는 상품 ID |

## POST /orders

주문하기입니다. 지금 가격으로 다시 계산해서 `expectedPaymentAmount`와 다르면 주문하지 않습니다.

#### 요청

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| header | Idempotency-Key | O | 주문서를 열 때 클라이언트가 만든 키. 같은 키로 다시 보내면 처음 주문을 응답 |
| body | items 또는 cartItemIds | O | 미리 보기와 같음. `cartItemIds`면 주문 뒤 그 장바구니 항목을 지움 |
| body | productCoupons | | 미리 보기와 같음 |
| body | orderMemberCouponId | | 미리 보기와 같음 |
| body | pointAmount | | 미리 보기와 같음 |
| body | expectedPaymentAmount | O | 화면에서 본 결제 금액 |

```http
POST /orders
Authorization: Bearer <token>
Idempotency-Key: 6b1f7f0e-3c55-4d8a-9a5e-2f0d8c1b7a90
Content-Type: application/json

{
  "cartItemIds": [31, 32, 33],
  "productCoupons": [
    { "productId": 11, "memberCouponId": 101 },
    { "productId": 13, "memberCouponId": 102 }
  ],
  "orderMemberCouponId": 103,
  "pointAmount": 7000,
  "expectedPaymentAmount": 93000
}
```

응답 201: [주문 상세](#get-ordersorderid)와 같은 본문입니다. `status`는 `ORDERED`입니다.

같은 키로 다시 보낸 경우 응답 200: 처음 주문과 같은 본문에 `Idempotent-Replayed: true` 헤더를 붙입니다. 이번 요청으로 새 주문이 생기지 않아서 201이 아니라 200으로 응답하고, 그래서 부하 테스트에서 재전송을 따로 셀 수 있습니다.

#### 에러

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | `COMMON_INVALID_REQUEST` | [요청 검사](#요청-검사) 위반, 멱등 키 없음 | |
| 401 | `AUTH_UNAUTHORIZED` | 토큰 문제 | |
| 404 | `ORDER_CART_ITEM_NOT_FOUND` | 장바구니 항목이 없거나 다른 회원의 항목 | |
| 404 | `ORDER_PRODUCT_NOT_FOUND` | 없는 상품 ID | |
| 409 | `ORDER_AMOUNT_CHANGED` | 결제 금액이 바뀜. 미리 보기를 다시 해야 함 | |
| 409 | `ORDER_PRODUCT_UNAVAILABLE` | 판매 중지·삭제된 상품 | |
| 409 | `ORDER_OUT_OF_STOCK` | 재고 부족 | 초과 판매 |
| 409 | `ORDER_COUPON_UNAVAILABLE` | 고른 쿠폰을 쓸 수 없음 | 쿠폰 이중 사용 |
| 409 | `POINT_BELOW_MINIMUM_USE` / `POINT_EXCEEDS_LIMIT` | 포인트 5,000 미만 또는 한도 초과 | |
| 409 | `POINT_INSUFFICIENT` | 포인트 잔액 부족 | 포인트 이중 사용 |
| 503 | `ORDER_RETRY` | 일시적 DB 실패(데드락, 잠금 대기 시간 초과, 연결 오류 등) | 주문 데드락 |
| 500 | `COMMON_INTERNAL_ERROR` | 금액 합계 불일치 (버그, 0건이 목표) | 금액 불일치 |

409와 503이면 아무것도 저장되지 않아서, 같은 키로 다시 보내면 새로 처리합니다.

## GET /me/orders

내 주문 목록이고, 최근 주문부터 보입니다.

#### 요청

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| query | cursor | | 이전 응답의 `nextCursor` |
| query | size | | 1~50, 기본 20 |
| query | status | | `ORDERED`, `CANCELED`, `CONFIRMED` 중 하나로 거르기 |

#### 응답 200

```json
{
  "items": [
    {
      "orderId": 5001,
      "status": "ORDERED",
      "orderedAt": "2026-11-11T00:01:12Z",
      "representativeProductName": "러닝화",
      "itemCount": 3,
      "paymentAmount": 93000
    }
  ],
  "nextCursor": "eyJvcmRlcmVkQXQiOi..."
}
```

- `representativeProductName`은 주문 상품 중 ID가 가장 작은 줄의 주문 시점 이름입니다.

## GET /orders/{orderId}

주문 상세이고, 이름과 가격은 주문 시점 값입니다.

#### 응답 200

```json
{
  "orderId": 5001,
  "status": "ORDERED",
  "orderedAt": "2026-11-11T00:01:12Z",
  "canceledAt": null,
  "confirmedAt": null,
  "productAmount": 118000,
  "discountAmount": 18000,
  "pointAmount": 7000,
  "paymentAmount": 93000,
  "earnedPointAmount": null,
  "items": [
    {
      "orderItemId": 9001,
      "productId": 11,
      "productName": "러닝화",
      "unitPrice": 59000,
      "quantity": 1,
      "amount": 59000,
      "productDiscountAmount": 5000,
      "orderDiscountAmount": 4910,
      "pointAmount": 3438,
      "paymentAmount": 45652
    },
    {
      "orderItemId": 9002,
      "productId": 12,
      "productName": "양말",
      "unitPrice": 3000,
      "quantity": 3,
      "amount": 9000,
      "productDiscountAmount": 0,
      "orderDiscountAmount": 818,
      "pointAmount": 572,
      "paymentAmount": 7610
    },
    {
      "orderItemId": 9003,
      "productId": 13,
      "productName": "티셔츠",
      "unitPrice": 25000,
      "quantity": 2,
      "amount": 50000,
      "productDiscountAmount": 3000,
      "orderDiscountAmount": 4272,
      "pointAmount": 2990,
      "paymentAmount": 39738
    }
  ],
  "coupons": [
    { "memberCouponId": 101, "couponName": "나이키 10% 할인", "orderItemId": 9001, "discountAmount": 5000 },
    { "memberCouponId": 102, "couponName": "티셔츠 3천 원 할인", "orderItemId": 9003, "discountAmount": 3000 },
    { "memberCouponId": 103, "couponName": "10만 원 이상 1만 원 할인", "orderItemId": null, "discountAmount": 10000 }
  ]
}
```

- `coupons[].orderItemId`가 `null`이면 주문 쿠폰입니다.
- `earnedPointAmount`는 구매 확정으로 쌓인 포인트이고, 확정 전이면 `null`입니다. 결제를 붙인 뒤에는 확정 직후 몇 초 동안 `null`일 수 있습니다.

#### 에러

| HTTP | 코드 | 상황 |
|---|---|---|
| 401 | `AUTH_UNAUTHORIZED` | 토큰 문제 |
| 404 | `ORDER_NOT_FOUND` | 주문이 없거나 다른 회원의 주문 |

## POST /orders/{orderId}/cancel

주문 취소이고 본문은 없습니다. 재고·쿠폰·포인트를 한 트랜잭션에서 되돌립니다.

응답 200: [주문 상세](#get-ordersorderid)와 같은 본문입니다. `status`는 `CANCELED`이고 `canceledAt`이 채워집니다.

#### 에러

| HTTP | 코드 | 상황 |
|---|---|---|
| 401 | `AUTH_UNAUTHORIZED` | 토큰 문제 |
| 404 | `ORDER_NOT_FOUND` | 주문이 없거나 다른 회원의 주문 |
| 409 | `ORDER_NOT_CANCELABLE` | 이미 취소되었거나 구매 확정된 주문 |
| 503 | `ORDER_RETRY` | 일시적 DB 실패(데드락, 잠금 대기 시간 초과, 연결 오류 등) |

## POST /orders/{orderId}/confirm

구매 확정이고 본문은 없습니다. 결제를 붙이기 전에는 같은 트랜잭션에서 결제 금액의 5%(원 미만 버림)를 포인트로 쌓습니다.

응답 200: [주문 상세](#get-ordersorderid)와 같은 본문입니다. `status`는 `CONFIRMED`이고 `confirmedAt`과 `earnedPointAmount`가 채워집니다. 결제를 붙인 뒤에는 `earnedPointAmount`가 잠깐 `null`일 수 있습니다.

#### 에러

| HTTP | 코드 | 상황 |
|---|---|---|
| 401 | `AUTH_UNAUTHORIZED` | 토큰 문제 |
| 404 | `ORDER_NOT_FOUND` | 주문이 없거나 다른 회원의 주문 |
| 409 | `ORDER_NOT_CONFIRMABLE` | 이미 취소되었거나 구매 확정된 주문 |
| 503 | `ORDER_RETRY` | 일시적 DB 실패(잠금 대기 시간 초과, 연결 오류 등) |

---

[이전: Flow](flows.md) | [문서 지도](../../README.md)
