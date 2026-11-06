# 문서 지도

flash-gate의 모든 설계 문서가 여기 있고, 종류에 따라 네 폴더로 나눕니다.

```
docs/
  reference/     프로젝트 전체에 걸친 것. 한 기능만의 내용은 두지 않음
  features/      기능 하나 = 폴더 하나. 폴더 이름은 src 모듈 이름과 같음
  adr/           결정 기록. 한 번 쓰면 고치지 않고, 바뀌면 새 ADR로 대체
  experiments/   측정 기록. 실험할 때마다 하나씩 추가
```

## 처음 읽는다면

1. [문제 정의](reference/problem.md): 무슨 상황을 가정하고, 어떤 숫자를 목표로 하는지
2. [유저 플로우](reference/user-flows.md): 회원이 겪는 모든 흐름과 번호
3. [쿠폰 기능](features/coupon/): 1단계 시나리오와 Risk
4. [ERD](reference/erd.md): 전체 테이블과 정합성을 지키는 방법
5. [ADR](adr/): 왜 Redis로 발급을 결정하는지, 왜 모듈러 모놀리스인지
6. [README 결과 표](../README.md#2-결과): Risk별 Before, After 수치

## reference: 전체 공통

| 문서 | 내용 |
|---|---|
| [problem.md](reference/problem.md) | 상황, 단계, 가정 트래픽, 목표 수치, 범위 밖 |
| [user-flows.md](reference/user-flows.md) | 전체 여정, 기능별 흐름 번호, 흐름 사이에 걸린 규칙 |
| [erd.md](reference/erd.md) | 전체 ERD, 제약 조건, 인덱스, 반정규화, 상태 값, 삭제 정책, 집계 규칙 |
| [api.md](reference/api.md) | 경로, 인증, 멱등성, 페이지, 에러 형식, HTTP 상태 코드 |
| [conventions.md](reference/conventions.md) | 명령, 작업 순서, 아키텍처, 트랜잭션, DB 규칙, 테스트, 문서 규칙 |
| [glossary.md](reference/glossary.md) | 도메인 용어와 뜻, 피할 말 |
| [roadmap.md](reference/roadmap.md) | 구현 순서와 작업마다 끝난 기준 |

## features: 기능별

| 기능 | 단계 | 코드 | 문서 | 상태 |
|---|---|---|---|---|
| 인증 | 1 | `src/auth/` | [README](features/auth/) · [Flow](features/auth/flows.md) · [API](features/auth/api.md) | 설계 완료 |
| 쿠폰 | 1 | `src/coupon/` | [README](features/coupon/) · [Flow](features/coupon/flows.md) · [API](features/coupon/api.md) | 설계 완료 |
| 상품 | 2 | `src/product/` | [README](features/product/) · [Flow](features/product/flows.md) · [API](features/product/api.md) | 설계 완료 |
| 장바구니 | 2 | `src/cart/` | [README](features/cart/) · [Flow](features/cart/flows.md) · [API](features/cart/api.md) | 설계 완료 |
| 주문 | 2 | `src/order/` | [README](features/order/) · [Flow](features/order/flows.md) · [API](features/order/api.md) | 설계 완료 |
| 포인트 | 2, 3 | `src/point/` | [README](features/point/) · [Flow](features/point/flows.md) · [API](features/point/api.md) | 설계 완료 |
| 결제 | 3 | `src/payment/` | [README](features/payment/) · [Flow](features/payment/flows.md) · [API](features/payment/api.md) | 설계 초안 |

각 기능 폴더에는 아래 세 문서가 있습니다.

| 문서 | 내용 |
|---|---|
| `README.md` | 기능 개요, Risk, 시나리오, 허용하는 불일치, 관련 ADR·실험 |
| `flows.md` | 시나리오의 시퀀스 다이어그램, SQL, 트랜잭션 경계, 실패 시 처리 |
| `api.md` | 이 기능의 엔드포인트, 요청·응답, 에러 코드 |

## adr, experiments

| 폴더 | 내용 |
|---|---|
| [adr/](adr/) | 되돌리기 어렵고 다른 선택지와 비교해서 고른 결정 |
| [experiments/](experiments/) | 부하 테스트와 개선 기록, 실험 계획 |

---

[README](../README.md)
