# 문서 지도

flash-gate의 모든 설계 문서가 여기 있습니다. 문서는 종류에 따라 네 폴더로 나눕니다.

```
docs/
  reference/     프로젝트 전체에 걸친 것. 한 기능만의 내용은 두지 않음
  features/      기능 하나 = 폴더 하나. 폴더 이름은 src 모듈 이름과 같음
  adr/           결정 기록. 한 번 쓰면 고치지 않고, 바뀌면 새 ADR로 대체
  experiments/   측정 기록. 실험할 때마다 하나씩 추가
```

## 처음 읽는다면

1. [문제 정의](reference/problem.md): 무슨 상황을 가정하고, 어떤 숫자를 목표로 하는지
2. [쿠폰 기능](features/coupon/): 1단계 시나리오와 Risk
3. [ERD](reference/erd.md): 전체 테이블과 정합성을 지키는 방법
4. [README 핵심 결과](../README.md#2-핵심-결과): Risk별 Before → After 수치

## reference: 전체 공통

| 문서 | 내용 |
|---|---|
| [problem.md](reference/problem.md) | 상황, 단계, 가정 트래픽, 목표 수치, 범위 밖 |
| [erd.md](reference/erd.md) | 전체 ERD, 제약 조건, 인덱스, 상태 값 |
| [api.md](reference/api.md) | 인증, 멱등성, 에러 형식, HTTP 상태 코드 |
| [conventions.md](reference/conventions.md) | 명령, 작업 순서, 코드 스타일, 계층, 문서 규칙 |

## features: 기능별

| 기능 | 단계 | 코드 | 문서 | 상태 |
|---|---|---|---|---|
| 쿠폰 | 1 | `src/coupon/` | [README](features/coupon/) · [Flow](features/coupon/flows.md) · [API](features/coupon/api.md) | 시나리오 작성 완료 |

각 기능 폴더에는 아래 세 문서가 있습니다.

| 문서 | 내용 |
|---|---|
| `README.md` | 기능 개요, Risk, 시나리오, 허용하는 불일치, 관련 ADR·실험 |
| `flows.md` | Risk가 있는 시나리오의 시퀀스 다이어그램, 실패 시 처리 |
| `api.md` | 이 기능의 엔드포인트, 요청·응답, 에러 코드 |

## adr, experiments

| 폴더 | 내용 |
|---|---|
| [adr/](adr/) | 기술·설계 결정 기록 |
| [experiments/](experiments/) | 부하 테스트와 개선 기록 |

---

[README](../README.md)
