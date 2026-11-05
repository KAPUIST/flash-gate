# 상품: API

경로, 페이지, 에러 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 상품 기능의 엔드포인트만 둡니다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 로그인 필요 | 시나리오 |
|---|---|---|---|---|
| GET | /brands | 브랜드 목록 | 아니오 | 1 |
| GET | /products | 상품 목록 | 아니오 | 2 |
| GET | /products/{productId} | 상품 상세 | 아니오 | 3 |

## GET /brands

**요청**: 없음.

**응답 200**

```json
{
  "items": [
    { "id": 1, "name": "브랜드A" },
    { "id": 2, "name": "브랜드B" }
  ]
}
```

- 이름 순입니다.
- 브랜드는 수가 적어서 페이지 없이 전체를 줍니다. 커서 방식의 예외입니다. `nextCursor`가 없습니다.

**에러**: 없음.

## GET /products

**요청**

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| query | brandId | number | X | 이 브랜드의 상품만 |
| query | cursor | string | X | 이전 응답의 `nextCursor` |
| query | size | number | X | 1~50, 기본 20 |

**응답 200**

```json
{
  "items": [
    {
      "id": 101,
      "name": "행사 운동화",
      "brand": { "id": 1, "name": "브랜드A" },
      "price": 89000,
      "saleStatus": "ON_SALE"
    },
    {
      "id": 100,
      "name": "행사 후드",
      "brand": { "id": 1, "name": "브랜드A" },
      "price": 59000,
      "saleStatus": "SOLD_OUT"
    }
  ],
  "nextCursor": "eyJpZCI6MTAwfQ"
}
```

- 최근 등록 순(`id` 내림차순)입니다.
- 삭제된 상품은 나오지 않습니다.
- `saleStatus`: `ON_SALE`(판매 중), `SOLD_OUT`(품절), `STOPPED`(판매 중지). 계산 규칙은 [README](README.md#판매-상태)에 있습니다.
- 남은 재고 수는 주지 않습니다.
- 없는 `brandId`는 에러가 아니라 빈 목록입니다.

**에러**

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `size`가 1~50 밖, `brandId`가 숫자가 아님, 해석할 수 없는 `cursor` |

## GET /products/{productId}

**요청**

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| path | productId | number | O | 상품 ID |

**응답 200**

```json
{
  "id": 101,
  "name": "행사 운동화",
  "brand": { "id": 1, "name": "브랜드A" },
  "price": 89000,
  "saleStatus": "ON_SALE"
}
```

**에러**

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `productId`가 숫자가 아님 |
| 404 | PRODUCT_NOT_FOUND | 없는 상품, 삭제된 상품 |

```json
{ "code": "PRODUCT_NOT_FOUND", "message": "상품을 찾을 수 없습니다" }
```

---

[← 이전: Flow](flows.md) | [문서 지도](../../README.md)
