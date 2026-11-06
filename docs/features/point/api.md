# 포인트: API

인증, 목록과 페이지, 에러 응답 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 포인트 기능의 엔드포인트만 둡니다.
포인트 사용·복구·적립에는 공개 엔드포인트가 없습니다. 주문 모듈이 포인트 모듈의 서비스를 부릅니다 ([README](README.md#다른-모듈이-부르는-서비스)).

## 엔드포인트

| 메서드 | 경로 | 설명 | 로그인 | 시나리오 |
|---|---|---|---|---|
| GET | /me/point | 포인트 잔액 | 필요 | 1 |
| GET | /me/point/history | 포인트 내역 | 필요 | 2 |

## GET /me/point

요청: 없습니다.

#### 응답 200

```json
{
  "balance": 12500,
  "minimumUseAmount": 5000,
  "maxUseRatePercent": 10
}
```

| 필드 | 설명 |
|---|---|
| balance | 잔액. 적립받은 적이 없으면 0 |
| minimumUseAmount | 한 번에 쓸 수 있는 최소 포인트 |
| maxUseRatePercent | 쿠폰 할인 뒤 금액 중 포인트로 낼 수 있는 최대 비율 |

클라이언트가 규칙을 하드코딩하지 않도록 규칙 값을 응답에 함께 줘서, 규칙이 바뀌어도 클라이언트를 고치지 않습니다.

#### 에러

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 401 | AUTH_UNAUTHORIZED | 토큰 없음, 잘못된 토큰, 만료 | |

## GET /me/point/history

#### 요청

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| query | cursor | X | 다음 페이지 커서 |
| query | size | X | 1~50, 기본 20 |
| query | type | X | `EARN`, `USE`, `USE_CANCEL` 중 하나. 없으면 전부 |

#### 응답 200

```json
{
  "items": [
    {
      "id": 301,
      "type": "EARN",
      "amount": 2750,
      "balanceAfter": 13181,
      "orderId": 88,
      "createdAt": "2026-11-18T03:00:00Z"
    },
    {
      "id": 287,
      "type": "USE",
      "amount": -5000,
      "balanceAfter": 10431,
      "orderId": 88,
      "createdAt": "2026-11-11T00:00:12Z"
    }
  ],
  "nextCursor": "eyJpZCI6Mjg3fQ"
}
```

- 예시의 주문 88은 쿠폰 할인 뒤 금액이 60,000원이라 포인트 한도가 6,000입니다. 5,000을 써서 잔액이 15,431에서 10,431로 줄었고, 결제 금액은 55,000원입니다. 구매 확정 때 floor(55,000 × 5%) = 2,750을 적립해서 잔액이 13,181이 됩니다.
- 최근 내역부터 정렬합니다 (`created_at DESC, id DESC`). `ix_point_history_member_created_at` 인덱스를 씁니다.
- `amount`는 부호가 있습니다. 적립과 사용 취소는 양수, 사용은 음수입니다.

#### 에러

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | COMMON_INVALID_REQUEST | `size` 범위 밖, 모르는 `type`, 잘못된 커서 | |
| 401 | AUTH_UNAUTHORIZED | 토큰 없음, 잘못된 토큰, 만료 | |

## 다른 기능의 응답에 쓰이는 에러

포인트 모듈이 던지고, 주문 API(`POST /orders`)가 응답합니다. 자세한 응답 형식은 [주문 API](../order/api.md)에 있습니다.

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 409 | POINT_BELOW_MINIMUM_USE | 쓰려는 포인트가 5,000 미만 | |
| 409 | POINT_EXCEEDS_LIMIT | 쓰려는 포인트가 쿠폰 할인 뒤 금액의 10%를 넘음 | |
| 409 | POINT_INSUFFICIENT | 잔액보다 많이 쓰려 함. 다른 주문이 먼저 쓴 경우 포함 | R11 |

- 세 에러 모두 주문 트랜잭션 전체를 롤백해서, 재고와 쿠폰 차감도 함께 취소됩니다.
- 5,000 미만과 10% 초과는 요청 값만으로 판단할 수 있지만 `400`이 아니라 `409`입니다. 10% 한도가 쿠폰 할인 결과에 따라 달라지는 지금 상태의 값이기 때문입니다.

---

[이전: Flow](flows.md) | [문서 지도](../../README.md)
