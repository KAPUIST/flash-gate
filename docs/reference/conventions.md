# 개발 규칙

## 명령

모든 명령은 저장소 루트에서 실행합니다.

```bash
npm ci             # 의존성 설치
npm run start:dev  # 개발 서버
npm run lint       # oxlint (타입 정보 기반 규칙 포함)
npm run format     # Prettier
npm test           # Vitest 단위 테스트
npm run test:e2e   # e2e 테스트
npm run build      # 빌드
```

변경을 마치기 전에 `lint`, `test`, `build`를 실행합니다.

## 작업 순서

1. 기능 문서(`docs/features/<기능>/README.md`)의 시나리오에 없는 동작은 만들지 않습니다. 시나리오를 먼저 고칩니다.
2. 코드보다 그 기능의 `flows.md`, `api.md`와 [ERD](erd.md)를 먼저 고칩니다.
3. Risk를 고치기 전에, 일부러 깨지는 구현으로 문제를 먼저 재현하고 Before 수치를 남깁니다.
4. 기술이나 설계를 고르면 [ADR](../adr/)을 씁니다.
5. 측정하면 [실험](../experiments/)에 기록하고 README 핵심 결과 표를 고칩니다.
6. 측정하지 않은 수치는 쓰지 않습니다. 꼭 써야 하면 `(미검증)`으로 표시합니다.
7. [문제 정의](problem.md)의 범위 밖 기능은 만들지 않습니다.

## 문서 규칙

- 한 기능에만 해당하는 내용은 `docs/features/<기능>/`에 둡니다. 여러 기능에 걸친 내용만 `docs/reference/`에 둡니다.
- 기능 폴더 이름은 `src/` 모듈 이름과 같게 씁니다. 예: `src/coupon/` ↔ `docs/features/coupon/`
- 기능을 고칠 때는 그 기능 폴더의 문서를 먼저 읽고, 코드와 같은 커밋에서 문서를 고칩니다.

### 새 기능을 추가할 때

1. `docs/features/<기능>/`을 만들고 `README.md`, `flows.md`, `api.md`를 씁니다. 형식은 [쿠폰 기능 문서](../features/coupon/)를 따릅니다.
2. `README.md`에는 개요 표, Risk, 시나리오, 허용하는 불일치, 관련 ADR·실험을 씁니다.
3. 새 Risk ID는 프로젝트 전체에서 이어서 매깁니다. 기존 ID는 다시 쓰지 않습니다.
4. 새 테이블은 [ERD](erd.md)에 추가하고, "테이블을 쓰는 기능" 표를 고칩니다.
5. [문서 지도](../README.md)의 features 표와 [README 핵심 결과](../../README.md#2-핵심-결과) 표에 한 줄씩 추가합니다.

## 코드 스타일

- 포맷은 Prettier 기본 설정(`.prettierrc`)을 따릅니다.
- TypeScript `strict`를 유지합니다.
- `no-floating-promises`는 error입니다. Promise는 `await`합니다. 의도적으로 결과를 버릴 때만 `void`를 붙입니다.
- 파일 이름은 Nest 규칙을 따릅니다. 예: `coupon-issue.service.ts`
- 모듈은 도메인 단위로 나눕니다. 예: `src/coupon/`

## 계층

| 계층 | 하는 일 | 하지 않는 일 |
|---|---|---|
| Controller | 요청 검증, 응답 변환 | 비즈니스 규칙 |
| Service | 흐름 조율, 트랜잭션 경계 | 저장소 세부 구현 |
| `domain/` class | 규칙 (발급 가능 시간, 수량 검사) | Nest 데코레이터, DB·Redis 접근 |

## 구현을 바꿔 끼우는 곳

- 같은 기능을 여러 방식으로 비교하는 곳은 abstract class로 추상화합니다. 예: `CouponStock`
- TypeScript `interface`는 실행 시점에 사라져서 Nest DI 토큰으로 쓸 수 없습니다. 그래서 abstract class를 토큰으로 씁니다.
- 어떤 구현을 쓸지는 모듈의 `{ provide: CouponStock, useClass: ... }` 한 곳에서만 정합니다.
- 바꿔 끼우지 않는 곳에는 추상화를 만들지 않습니다.
- 일부러 깨지게 만든 실험용 구현(예: `no-lock.stock.ts`)은 지우지 않습니다. Before 수치를 다시 낼 때 씁니다.

## 하지 않는 것

- 처음부터 헥사고날이나 DDD 폴더 구조를 쓰지 않습니다.
- 커밋과 PR에 AI 작성 표시를 넣지 않습니다.

---

[← 이전: API 공통 규칙](api.md) | [문서 지도](../README.md)
