# 쿠폰: API

> **작성 전입니다.** 아래 내용은 템플릿 예시이며, 확정된 설계가 아닙니다.

인증, 멱등성, 에러 응답 형식 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 쿠폰 기능의 엔드포인트만 둡니다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 멱등 | 시나리오 |
|---|---|---|---|---|
| POST | /coupons/{id}/issue | 쿠폰 다운로드 | `Idempotency-Key` 필요 | 1 |
| GET | /members/me/coupons | 내 쿠폰 목록 | 조회라서 멱등 | 1 |

## POST /coupons/{id}/issue

**요청**

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| path | id | O | 쿠폰 ID |
| header | Idempotency-Key | O | 같은 키로 다시 요청하면 처음 결과를 반환 |

**응답**

| HTTP | 코드 | 상황 | 관련 Risk |
|---|---|---|---|
| 201 | - | 발급 완료 | |
| 409 | COUPON_SOLD_OUT | 잔여 수량 없음 | R1 |
| 409 | COUPON_ALREADY_ISSUED | 이미 발급받음 | R2 |
| 409 | COUPON_NOT_STARTED | 발급 시작 전 | |
| 503 | COUPON_ISSUE_RETRY | 저장 실패로 수량을 되돌림. 다시 시도 | R3 |

---

[← 이전: Flow](flows.md) | [문서 지도](../../README.md)
