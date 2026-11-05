# 장바구니: API

경로, 에러 형식, 상태 코드 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 장바구니 기능의 엔드포인트만 둡니다.
모든 엔드포인트는 로그인이 필요합니다. 토큰이 없거나 틀리면 `401 AUTH_UNAUTHORIZED`입니다 ([인증 API](../auth/api.md#토큰-사용법)).

## 엔드포인트

| 메서드 | 경로 | 설명 | 시나리오 |
|---|---|---|---|
| POST | /me/cart/items | 장바구니에 담기 | 1 |
| GET | /me/cart | 장바구니 보기 | 2 |
| PATCH | /me/cart/items/{cartItemId} | 수량 바꾸기 | 3 |
| DELETE | /me/cart/items | 하나 또는 여러 개 빼기 | 4 |

## POST /me/cart/items

**요청**

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| body | productId | number | O | 상품 ID |
| body | quantity | number | O | 담을 수량. 1~99 |

```json
{ "productId": 101, "quantity": 2 }
```

**응답 201 (새 항목) / 200 (이미 담긴 상품의 수량을 늘림)**

```json
{ "cartItemId": 5001, "productId": 101, "quantity": 5 }
```

- `quantity`는 담은 뒤의 수량입니다. 이미 3개 담긴 상품을 2개 더 담으면 5입니다.
- 새 장바구니 항목이 생기면 201, 이미 담긴 상품의 수량만 늘었으면 200입니다 ([HTTP 상태 코드](../../reference/api.md#http-상태-코드)).

**에러**

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `quantity`가 1~99 밖, `productId`가 숫자가 아님 |
| 404 | PRODUCT_NOT_FOUND | 없는 상품, 삭제된 상품 |
| 409 | CART_PRODUCT_NOT_ON_SALE | 판매 중지된 상품 |
| 409 | CART_QUANTITY_EXCEEDED | 이미 담긴 수량과 더하면 99 초과. 기존 수량은 그대로 |
| 409 | CART_FULL | 장바구니에 이미 100종이 있는데 새 상품을 담음 |

```json
{ "code": "CART_QUANTITY_EXCEEDED", "message": "한 상품은 99개까지 담을 수 있습니다" }
```

## GET /me/cart

**요청**: 없음.

**응답 200**

```json
{
  "items": [
    {
      "cartItemId": 5001,
      "product": {
        "id": 101,
        "name": "행사 운동화",
        "brand": { "id": 1, "name": "브랜드A" }
      },
      "unitPrice": 89000,
      "quantity": 2,
      "amount": 178000,
      "saleStatus": "ON_SALE"
    },
    {
      "cartItemId": 5000,
      "product": {
        "id": 100,
        "name": "행사 후드",
        "brand": { "id": 1, "name": "브랜드A" }
      },
      "unitPrice": 59000,
      "quantity": 1,
      "amount": 59000,
      "saleStatus": "SOLD_OUT"
    }
  ],
  "totalAmount": 178000,
  "onSaleItemCount": 1
}
```

- 최근 담은 순입니다. 최대 100종이라 페이지가 없습니다.
- `unitPrice`는 지금 가격입니다. `amount = unitPrice × quantity`입니다.
- `saleStatus`: `ON_SALE`, `SOLD_OUT`, `STOPPED` ([상품 README](../product/README.md#판매-상태)).
- `totalAmount`와 `onSaleItemCount`는 `ON_SALE` 항목만 셉니다.
- 장바구니가 없거나 비었으면 `{ "items": [], "totalAmount": 0, "onSaleItemCount": 0 }`입니다.

**에러**: 공통 401 외에 없음.

## PATCH /me/cart/items/{cartItemId}

**요청**

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| path | cartItemId | number | O | 장바구니 항목 ID |
| body | quantity | number | O | 새 수량. 1~99. 더하는 값이 아님 |

```json
{ "quantity": 3 }
```

**응답 200**

```json
{ "cartItemId": 5001, "quantity": 3 }
```

**에러**

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `quantity`가 1~99 밖. 0으로 만들려면 빼기를 쓴다 |
| 404 | CART_ITEM_NOT_FOUND | 없는 항목, 다른 회원의 항목 |

```json
{ "code": "CART_ITEM_NOT_FOUND", "message": "장바구니 항목을 찾을 수 없습니다" }
```

## DELETE /me/cart/items

**요청**

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| query | ids | string | O | 뺄 장바구니 항목 ID를 쉼표로 이은 값. 1~100개. 예: `ids=5000,5001` |

**응답 204**: 본문 없음.

- 없는 항목, 이미 빠진 항목, 다른 회원의 항목은 무시합니다. 에러가 아닙니다.
- 같은 요청을 다시 보내도 결과가 같습니다.

**에러**

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `ids`가 없음, 비었음, 100개 초과, 숫자가 아닌 값 |

---

[← 이전: Flow](flows.md) | [문서 지도](../../README.md)
