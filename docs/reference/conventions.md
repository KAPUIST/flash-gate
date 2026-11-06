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
4. 되돌리기 어렵고, 다른 선택지와 비교해서 고른 결정이면 [ADR](../adr/)을 씁니다. 익숙한 도구를 고른 것처럼 비교가 없었던 결정은 쓰지 않습니다.
5. 측정하면 [실험](../experiments/)에 기록하고 README 결과 표를 고칩니다.
6. 측정하지 않은 수치는 쓰지 않고, 꼭 써야 하면 `(미검증)`으로 표시합니다.
7. [문제 정의](problem.md)의 범위 밖 기능은 만들지 않습니다.

## 문서 규칙

- 한 기능에만 해당하는 내용은 `docs/features/<기능>/`에 둡니다. 여러 기능에 걸친 내용만 `docs/reference/`에 둡니다.
- 기능 폴더 이름은 `src/` 모듈 이름과 같게 씁니다. 예: `src/coupon/`과 `docs/features/coupon/`
- 기능을 고칠 때는 그 기능 폴더의 문서를 먼저 읽고, 코드와 같은 커밋에서 문서를 고칩니다.
- 도메인 용어는 [용어집](glossary.md)에 둡니다. 저장소 루트에 `GLOSSARY.md`를 만들지 않습니다.

### 새 기능을 추가할 때

1. `docs/features/<기능>/`을 만들고 `README.md`, `flows.md`, `api.md`를 씁니다. 형식은 [쿠폰 기능 문서](../features/coupon/)를 따릅니다.
2. `README.md`에는 개요 표, Risk, 시나리오, 허용하는 불일치, 관련 ADR·실험을 씁니다.
3. 새 Risk ID는 프로젝트 전체에서 이어서 매깁니다. 기존 ID는 다시 쓰지 않습니다.
4. 새 테이블은 [ERD](erd.md)에 추가하고, "테이블을 쓰는 기능" 표를 고칩니다.
5. [문서 지도](../README.md)의 features 표와 [README 결과 표](../../README.md#2-결과)에 한 줄씩 추가합니다.

### 용어집

- 같은 개념을 가리키는 말이 여럿이면 하나만 고르고, 나머지는 `_피할 말_`에 적습니다.
- 정의는 한두 문장으로 씁니다. 하는 일이 아니라 그것이 무엇인지 씁니다.
- 이 프로젝트에만 있는 개념만 적습니다. 타임아웃, 재시도 같은 일반 프로그래밍 개념은 적지 않습니다.
- 코드의 클래스·변수 이름, 테스트 이름, 문서는 이 용어를 그대로 씁니다.

### ADR

되돌리기 어렵고 다른 선택지와 비교해서 고른 결정만 씁니다. 수량을 Redis로 관리할지 DB로 관리할지 같은 결정입니다. 익숙한 도구를 고른 것처럼 비교가 없었던 결정은 쓰지 않습니다. 파일 이름은 `0001-<결정-요약>.md` 형식입니다.

```markdown
# ADR-000N: <결정 제목>

- 상태: 제안 / 채택 / 폐기 / ADR-000M으로 대체
- 날짜: YYYY-MM-DD
- 관련 Risk: R1

## 문제
## 선택지 (최소 2개, 장점·단점 표)
## 결정
## 이유 (실험 결과 링크)
## 감수하는 것
```

## 코드 스타일

- 포맷은 Prettier 기본 설정(`.prettierrc`)을 따릅니다.
- TypeScript `strict`를 유지합니다.
- `no-floating-promises`는 error입니다. Promise는 `await`하고, 결과를 일부러 버릴 때만 `void`를 붙입니다.
- 파일 이름은 Nest 규칙을 따릅니다. 예: `issue-coupon.service.ts`
- 모듈은 기능 단위로 나눕니다. 예: `src/coupon/`
- 이름은 [용어집](glossary.md)의 용어를 영어로 그대로 옮깁니다. 예: 회원 쿠폰은 `MemberCoupon`, 발급은 `issue`

## 아키텍처

모듈러 모놀리스입니다. 포트는 구현을 둘 이상 비교하는 곳에만 둡니다 ([ADR-0002](../adr/0002-modular-monolith-with-one-port.md)).

```
src/
  coupon/                          # 모듈 = 기능 = docs/features/coupon/
    coupon.module.ts
    index.ts                       # 공개 API. 다른 모듈은 이 파일로만 import
    issue-coupon/                  # 유스케이스 하나 = 폴더 하나
      issue-coupon.controller.ts
      issue-coupon.service.ts      # 흐름 조율, 트랜잭션 경계
      issue-coupon.dto.ts
      issue-coupon.service.spec.ts
    my-coupons/                    # 조회는 포트 없이 DB를 바로 읽는다
    domain/                        # 순수 TypeScript. Nest·TypeORM·Redis import 금지
      coupon.ts
      discount.ts                  # Discount, FixedDiscount, RateDiscount
    ports/
      issuance-strategy.ts         # abstract class. 구현을 비교하는 곳만
    infra/
      issuance/                    # 포트 구현
      persistence/                 # TypeORM 엔티티 (데코레이터는 여기에만)
  order/  product/  cart/  point/  auth/  payment/
  shared/
    database/                      # BaseTimeEntity, 데이터 소스, 트랜잭션 설정
    redis/
    config/
bench/k6/                          # 부하 테스트 스크립트
```

| 계층 | 하는 일 | 하지 않는 일 |
|---|---|---|
| Controller | 요청 검증, 응답 변환 | 비즈니스 규칙 |
| Service | 흐름 조율, 트랜잭션 경계 | 저장소 세부 구현 |
| `domain/` class | 규칙 (발급 가능 시간, 할인 계산, 주문 금액 검사) | Nest 데코레이터, DB·Redis 접근 |
| `infra/` | 엔티티, 포트 구현, Redis 호출 | 비즈니스 규칙 |

### 모듈 사이의 규칙

- 다른 모듈은 그 모듈의 `index.ts`가 공개한 서비스만 함수로 호출합니다. HTTP로 부르지 않습니다.
- 다른 모듈의 테이블을 직접 읽거나 쓰지 않습니다. 예: 주문 모듈은 `member_coupon`을 직접 UPDATE하지 않고, 쿠폰 모듈의 `useCoupon()`을 회원 쿠폰 한 장마다 부릅니다.
- 이 규칙은 dependency-cruiser로 CI에서 검사합니다. 설정은 첫 코드를 쓸 때 추가합니다.
  - `domain/`은 `infra/`, `ports/`, `@nestjs/*`, `typeorm`, `ioredis`를 import하지 않습니다.
  - 다른 모듈의 파일은 `index.ts`로만 import하고, `shared/`는 예외입니다.
- 규칙 위반 메시지에는 고치는 방법을 적어서, 에이전트도 그 메시지를 보고 스스로 고치게 합니다.

### 트랜잭션

- `@nestjs-cls/transactional`과 TypeORM 어댑터를 씁니다. 트랜잭션을 인자로 넘기지 않아도 같은 요청 안의 다른 모듈 서비스가 같은 트랜잭션에 참여합니다.
- `typeorm-transactional`은 2023년 이후 배포가 없어서 쓰지 않습니다.
- Redis 호출은 DB 트랜잭션 밖에서 해서, Redis 왕복 동안 DB 커넥션을 붙잡지 않습니다.
- CLS 컨텍스트 밖(분리된 비동기 콜백 등)에서 부르면 트랜잭션 없이 실행될 수 있습니다. 3단계 비동기 처리에서 테스트로 확인합니다 (미검증).

## DB와 엔티티

- 스키마는 [ERD](erd.md)가 기준입니다. ERD를 먼저 고치고 마이그레이션을 씁니다.
- TypeORM `synchronize`는 끄고, 스키마는 마이그레이션으로만 바꿉니다.
- 모든 엔티티는 `BaseTimeEntity`(`createdAt`, `updatedAt`)를 상속합니다. 예외로 `point_history`는 고치지 않는 테이블이라 `createdAt`만 둡니다. TypeORM의 `BaseEntity`(Active Record)와 이름이 겹치지 않게 이 이름을 씁니다.
- `@DeleteDateColumn`은 soft delete 하는 엔티티(member, coupon, product)에 직접 붙입니다. 이 컬럼이 있으면 조회 동작이 바뀌어서 부모 클래스에 숨기지 않습니다.
- bigint ID는 `number`로 받고, 드라이버 설정으로 int8을 숫자로 바꿉니다. 구체적인 옵션 이름은 구현할 때 확인합니다 (미검증).
- 바뀌지 않는 사실은 DB 제약으로, 바뀌는 정책은 도메인 클래스로 지킵니다 ([ERD 공통 규칙](erd.md#공통-규칙)).
- 동시에 바뀌는 수량(재고, 포인트 잔액, 회원 쿠폰 상태)은 조건부 UPDATE 한 문장으로 바꿉니다. `findOne`으로 읽고 값을 바꾼 뒤 `save()`하는 방식은 읽은 값으로 덮어써서 갱신 손실이 생기므로 쓰지 않습니다. 이 방식은 실험의 Before 구현에서만 일부러 씁니다.

## 테스트

테스트는 공개된 경계(seam)에서만 합니다. 내부 구현을 직접 부르지 않아서, 구현을 바꿔도 테스트는 그대로 남습니다.

| 경계 | 무엇을 | 도구 | 잡는 것 | 못 잡는 것 |
|---|---|---|---|---|
| HTTP (e2e) | 시나리오의 요청과 응답. 실제 PostgreSQL·Redis | Vitest + supertest + docker compose | 시나리오 분기, 에러 코드, 트랜잭션, 제약 | 대량 부하 |
| 동시성 테스트 | 같은 요청 N개를 동시에 보내고 DB 상태 확인 | e2e와 같음 + `Promise.all` | `R2`, `R7`, `R10`, `R11`처럼 동시에만 깨지는 규칙 | 실제 트래픽 크기 |
| 도메인 클래스 (단위) | 할인 계산, 상품별 나누기, 포인트 규칙, 발급 가능 시간 | Vitest | 금액 계산 (`R9`), 규칙 경계값 | DB 동작 |
| 포트 구현 (계약 테스트) | `IssuanceStrategy`의 모든 구현이 같은 테스트를 통과 | Vitest + 실제 Redis·PostgreSQL | 구현을 바꿔도 결과가 같은지 | 성능 차이 |
| 부하 (실험) | k6 시나리오 | k6 | `R1`, `R4`, `R6` 같은 수치 | 구체적인 원인 (로그·쿼리로 따로 확인) |

- 테스트 이름은 시나리오 문장으로 씁니다. 예: `"마지막 1장에 두 회원이 동시에 요청하면 한 명만 받는다"`
- 기대값은 코드와 같은 방식으로 다시 계산하지 않고, 문서의 계산 예시(예: [주문 금액 예시](../features/order/README.md)) 숫자를 그대로 씁니다.
- 이 프로젝트의 문제는 대부분 DB와 Redis의 동시성에서 생겨서, DB를 목(mock)으로 바꾸지 않습니다.
- 실험의 Before 구현(일부러 깨지는 구현)에도 "이 구현은 동시 요청에서 초과 발급한다"를 확인하는 테스트가 있습니다.

## 구현을 바꿔 끼우는 곳

- 같은 기능을 여러 방식으로 비교하는 곳은 abstract class로 추상화합니다. 예: `IssuanceStrategy`
- TypeScript `interface`는 실행 시점에 사라져서 Nest DI 토큰으로 쓸 수 없어서, abstract class를 토큰으로 씁니다. abstract class에는 추상 메서드만 둡니다.
- 어떤 구현을 쓸지는 모듈의 `useFactory` 한 곳에서 환경 변수로 정합니다. 예: `ISSUANCE_STRATEGY=redis`
- 바꿔 끼우지 않는 곳에는 추상화를 만들지 않습니다. 구현이 하나뿐이고 테스트 대역도 쓰지 않는 포트가 생기면 지웁니다.
- 일부러 깨지게 만든 실험용 구현은 Before 수치를 다시 낼 때 쓰므로 지우지 않습니다.

## 하지 않는 것

- 모든 저장소에 포트·어댑터·매퍼를 두는 정석 헥사고날 구조를 쓰지 않습니다. 진입점이 둘 이상이 되거나(예: 3단계 비동기 워커) 도메인 규칙이 매핑 비용보다 커지면 다시 검토합니다.
- `@nestjs/cqrs` 같은 명령·이벤트 버스를 1·2단계에서 쓰지 않습니다.
- 사라지면 안 되는 부수 효과를 프로세스 안 이벤트(`@nestjs/event-emitter`)로 보내지 않습니다. 서버가 죽으면 이 이벤트는 사라집니다.

---

[이전: API 공통 규칙](api.md) | [문서 지도](../README.md) | [다음: 용어집](glossary.md)
