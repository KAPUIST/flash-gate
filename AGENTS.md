# flash-gate 작업 규칙

사람과 AI 코딩 에이전트가 함께 따르는 규칙입니다.

## 프로젝트

- 플래시 세일 시작 직후 몰리는 요청을 정해진 수량만큼만 통과시키는 백엔드입니다.
- 문제 정의는 `docs/00-problem.md`, Risk 목록은 `docs/01-scenarios.md`에 있습니다.
- 지금은 1단계(한정 수량 쿠폰 발급)입니다. 2·3단계 기능은 만들지 않습니다.

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

변경을 마치기 전에 `lint`, `test`, `build`를 실행하고 결과를 보고합니다.

## 작업 순서

1. 시나리오(`01`)에 Risk가 없는 기능은 만들지 않습니다. 먼저 시나리오를 고칩니다.
2. 코드보다 `02-erd`, `03-flows`, `04-api`를 먼저 고칩니다.
3. Risk를 고치기 전에 깨지는 구현으로 먼저 재현하고 Before 수치를 남깁니다.
4. 기술이나 설계를 고르면 `docs/adr/`에 ADR을 씁니다.
5. 측정하면 `docs/experiments/`에 기록하고 README 핵심 결과 표를 고칩니다.
6. 측정하지 않은 수치는 문서에 쓰지 않습니다. 필요하면 `(미검증)`으로 표시합니다.

문서 작성법은 템플릿의 작성 가이드를 따릅니다. 형용사 대신 숫자를 쓰고, 선택지와 감수하는 것을 같이 씁니다.

## 코드 규칙

- 포맷은 Prettier 기본 설정(`.prettierrc`)을 따릅니다.
- TypeScript `strict`를 유지합니다.
- `no-floating-promises`는 error입니다. Promise는 `await`하거나, 의도적으로 버릴 때만 `void`를 붙입니다.
- 파일 이름은 Nest 규칙을 따릅니다. 예: `coupon-issue.service.ts`
- 모듈은 도메인 단위로 나눕니다. 예: `src/coupon/`

## 계층

| 계층 | 하는 일 | 하지 않는 일 |
|---|---|---|
| Controller | 요청 검증, 응답 변환 | 비즈니스 규칙 |
| Service | 흐름 조율, 트랜잭션 경계 | 저장소 세부 구현 |
| `domain/` class | 규칙 (발급 가능 시간, 수량 검사) | Nest 데코레이터, DB·Redis 접근 |

## 바꿔 끼우는 구현

- 같은 기능을 여러 방식으로 비교하는 곳은 abstract class로 추상화합니다. 예: `CouponStock`
- TypeScript `interface`는 실행 시점에 사라져서 Nest DI 토큰으로 쓸 수 없습니다. abstract class를 토큰으로 씁니다.
- 구현 선택은 모듈의 `{ provide: CouponStock, useClass: ... }` 한 곳에서만 바꿉니다.
- 바꿔 끼우지 않는 곳에는 추상화를 만들지 않습니다.
- 실험용으로 일부러 깨지는 구현(예: `no-lock.stock.ts`)은 지우지 않습니다. Before 수치를 다시 낼 때 씁니다.

## 하지 않는 것

- 처음부터 헥사고날이나 DDD 폴더 구조를 쓰지 않습니다.
- `docs/00-problem.md`의 범위 밖 기능을 만들지 않습니다.
- 커밋과 PR에 AI 작성 표시를 넣지 않습니다.
