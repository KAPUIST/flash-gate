# 인증: Flow

로그인(시나리오 1, 2)과 토큰 검사(시나리오 3)를 그립니다.

## 시나리오 1, 2. 로그인

```mermaid
sequenceDiagram
    actor U as 회원
    participant A as API
    participant D as PostgreSQL

    U->>A: POST /auth/login<br/>email, password
    alt 형식 오류
        A-->>U: 400 COMMON_INVALID_REQUEST
    end
    A->>D: 탈퇴하지 않은 회원을 이메일로 조회
    D-->>A: 회원 또는 없음
    alt 회원 없음 (탈퇴 회원 포함)
        A->>A: 가짜 해시와 비밀번호 비교<br/>응답 시간을 맞추기 위함
        A-->>U: 401 AUTH_INVALID_CREDENTIALS
    else 회원 있음
        A->>A: 저장된 해시와 비밀번호 비교
        alt 비밀번호 틀림
            A-->>U: 401 AUTH_INVALID_CREDENTIALS
        else 비밀번호 맞음
            A->>A: JWT 서명<br/>sub = 회원 ID, iat = 지금, exp = 지금 + 1시간
            A-->>U: 200 accessToken
        end
    end
```

회원 조회 SQL입니다. 탈퇴한 회원은 조건에서 빠집니다.

```sql
SELECT id, password_hash
FROM member
WHERE email = :email
  AND deleted_at IS NULL;
```

- 이 조회는 `uq_member_email_active` 부분 인덱스를 씁니다 ([ERD](../../reference/erd.md#member-회원)).
- 로그인은 데이터를 바꾸지 않습니다. 트랜잭션이 필요 없습니다.
- JWT 서명 키는 환경 변수(`JWT_SECRET`)에서 읽습니다. 코드와 문서에 값을 적지 않습니다.

## 시나리오 3. 토큰 검사

로그인이 필요한 모든 API 앞에서 Nest Guard가 토큰을 검사합니다.

```mermaid
flowchart TD
    req["요청 도착"] --> h{"Authorization 헤더가<br/>Bearer 형식인가"}
    h -- 아니오 --> e401["401 AUTH_UNAUTHORIZED"]
    h -- 예 --> sig{"서명이 맞는가"}
    sig -- 아니오 --> e401
    sig -- 예 --> exp{"만료 시각 전인가"}
    exp -- 아니오 --> e401
    exp -- 예 --> ok["토큰의 sub를 회원 ID로 쓰고<br/>컨트롤러로 넘김"]
```

- Guard는 DB를 읽지 않습니다. 쿠폰 발급처럼 몰리는 요청마다 회원 조회가 붙지 않게 하려는 것입니다.
- 그래서 탈퇴한 회원의 토큰은 만료될 때까지 통과합니다. [허용하는 불일치](README.md#시나리오-3-토큰-없이-잘못된-토큰-만료된-토큰으로-요청)에 적었습니다.

---

[← 이전: 인증](README.md) | [문서 지도](../../README.md) | [다음: API →](api.md)
