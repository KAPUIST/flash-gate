# 결제: API

> 3단계 초안입니다.

인증, 에러 응답 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따르고, 이 문서에는 결제 기능의 엔드포인트만 둡니다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 로그인 | 시나리오 |
|---|---|---|---|---|
| POST | /orders/{orderId}/payments | 결제 요청 (Mock PG 승인) | 필요 | 1~5 |

- 주문 취소는 결제 API가 아니라 주문 API(`POST /orders/{orderId}/cancel`)입니다. 3단계에서는 그 안에서 결제 취소를 먼저 합니다 (시나리오 6, [Flow](flows.md#시나리오-6-결제된-주문-취소)).
- 결제 결과를 다시 확인할 때는 주문 상세(`GET /orders/{orderId}`)를 봅니다. 3단계에서 응답에 `payment` 필드를 더합니다.

## POST /orders/{orderId}/payments

#### 요청

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| path | orderId | O | 주문 ID |
| body | method | O | `MOCK_CARD`만 지원 |
| header | X-Mock-Pg-Result | X | 테스트용 Mock PG 동작 제어. 아래 표 참고 |

```json
{ "method": "MOCK_CARD" }
```

- 결제 멱등 키는 요청에서 받지 않고, 서버가 결제 행을 만들 때 만들어 결제사에 보냅니다. 같은 주문의 두 번째 결제 요청은 주문 상태 조건(`PAYMENT_PENDING → PAYING`)에서 막힙니다.
- 결제 금액은 요청에서 받지 않고 주문의 `payment_amount`를 씁니다.

#### 응답 200 (승인)

```json
{
  "orderId": 88,
  "orderStatus": "ORDERED",
  "payment": {
    "status": "APPROVED",
    "amount": 41391,
    "approvedAt": "2026-11-11T00:01:05Z"
  }
}
```

#### 응답 202 (결과 확인 중, 시나리오 4)

```json
{
  "orderId": 88,
  "orderStatus": "PAYING",
  "payment": { "status": "REQUESTED", "amount": 41391 }
}
```

- `202`는 [API 공통 규칙](../../reference/api.md#http-상태-코드)의 표에 "요청은 받았고 결과는 나중에 확정됨"(3단계 초안)으로 들어 있습니다.

#### 에러

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 400 | COMMON_INVALID_REQUEST | 지원하지 않는 `method` | |
| 401 | AUTH_UNAUTHORIZED | 토큰 없음, 잘못된 토큰, 만료 | |
| 404 | ORDER_NOT_FOUND | 주문이 없거나 다른 회원의 주문 | |
| 409 | PAYMENT_IN_PROGRESS | 이미 결제를 요청해서 결과를 기다리는 중 (`PAYING`) | R14 |
| 409 | PAYMENT_EXPIRED | 주문 후 20분이 지남 | |
| 409 | PAYMENT_NOT_PAYABLE | 결제할 수 없는 상태 (`ORDERED`, `PAYMENT_FAILED`, `CANCELED` 등) | |
| 409 | PAYMENT_DECLINED | 결제사가 거절함. 재고·쿠폰·포인트는 복구됨. `message`에 사유 | |
| 409 | PAYMENT_AMOUNT_MISMATCH | 결제사가 승인한 금액이 주문 금액과 다름. 승인을 취소하고 실패 처리함 | R13 |
| 503 | PAYMENT_RETRY | 결제 행을 만들지 못함 (DB 에러). 결제사에는 아직 요청하지 않음 | |

## 주문 취소의 3단계 응답 (참고)

`POST /orders/{orderId}/cancel`의 기본 응답은 [주문 API](../order/api.md)에 있고, 3단계에서 아래 경우가 더해집니다.

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 202 | - | 결제 취소가 바로 끝나지 않아 처리 중 (`CANCELING`). 워커가 재시도 | R13 |
| 409 | ORDER_CANCEL_IN_PROGRESS | 이미 취소 중 | |

## Mock PG 동작 제어

부하 테스트와 e2e 테스트에서 결제사의 응답을 마음대로 만들기 위한 장치입니다. 운영 환경에서는 헤더를 무시합니다 (`NODE_ENV=production`이면 끔).

| `X-Mock-Pg-Result` | Mock PG 동작 | 쓰는 시나리오 |
|---|---|---|
| (없음) 또는 `approve` | 바로 승인 | 1 |
| `decline` | 바로 거절 (사유: 한도 초과) | 2 |
| `timeout` | 10초 동안 응답하지 않음. 그 뒤 조회하면 "승인됨" | 4 |
| `timeout-not-received` | 10초 동안 응답하지 않음. 조회하면 "기록 없음" | 4 |
| `approve-amount-mismatch` | 요청 금액보다 1원 적게 승인 | 5 |
| `cancel-fail` | 승인은 바로 하고, 그 거래의 취소 요청은 3번까지 실패 | 5, 6 |

- 부하 테스트에서는 헤더 대신 Mock PG의 환경 변수로 비율을 정합니다 (가정, 구현 시 확정). 예를 들어 `MOCK_PG_TIMEOUT_RATE=0.05`이면 5%를 타임아웃으로 만듭니다.
- Mock PG의 결제사 API는 승인 요청, 멱등 키로 결과 조회, 거래 ID로 승인 취소의 세 개입니다. 같은 멱등 키의 승인과 같은 거래 ID의 취소는 한 번만 처리합니다.

---

[이전: Flow](flows.md) | [문서 지도](../../README.md)
