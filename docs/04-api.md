# 04. API

> **작성 전입니다.** 아래 내용은 템플릿 예시이며, 확정된 설계가 아닙니다.

상세 스펙은 <Swagger/OpenAPI 주소>에서 봅니다. 이 문서에는 규칙과 목록만 둡니다.

## 공통 규칙

- **인증**: <예: Authorization: Bearer {token}>
- **멱등성**: 상태를 바꾸는 요청은 `Idempotency-Key` 헤더를 받습니다. 같은 키로 다시 요청하면 처음 결과를 그대로 반환합니다.
- **에러 응답 형식**:

```json
{ "code": "COUPON_SOLD_OUT", "message": "쿠폰이 소진되었습니다" }
```

## 엔드포인트

| 메서드 | 경로 | 설명 | 멱등 | 관련 케이스 |
|---|---|---|---|---|
| POST | /coupons/{id}/issue | 쿠폰 다운로드 | 키 필요 | CASE 1-1 |
| GET | /members/me/coupons | 내 쿠폰 목록 | 자연 멱등 | |

## 에러 코드

| 코드 | HTTP | 상황 |
|---|---|---|
| COUPON_SOLD_OUT | 409 | 잔여 수량 없음 |
| COUPON_ALREADY_ISSUED | 409 | 이미 발급받음 |

---

[← 이전: 03. Flow](03-flows.md) | [README](../README.md) | [다음: ADR 목록 →](adr/)
