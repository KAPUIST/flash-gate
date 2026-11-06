# 인증: API

경로, 에러 형식, 상태 코드 같은 공통 규칙은 [API 공통 규칙](../../reference/api.md)을 따릅니다. 이 문서에는 인증 기능의 엔드포인트만 둡니다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 로그인 필요 | 시나리오 |
|---|---|---|---|---|
| POST | /auth/login | 이메일과 비밀번호로 토큰 받기 | 아니오 | 1, 2 |

로그인이 필요한 다른 모든 API는 [토큰 사용법](#토큰-사용법)을 따릅니다 (시나리오 3).

## POST /auth/login

#### 요청

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| body | email | string | O | 이메일 형식. 최대 255자 |
| body | password | string | O | 1~64자 |

```json
{ "email": "member1@example.com", "password": "<비밀번호>" }
```

#### 응답 200

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

- `expiresIn`은 초 단위입니다.
- 새 자원 생성(201)이 아니라 토큰을 만드는 것이라서 200을 씁니다.

#### 에러

| HTTP | 코드 | 상황 |
|---|---|---|
| 400 | COMMON_INVALID_REQUEST | 이메일 형식이 아님, 비밀번호가 비었거나 64자 초과 |
| 401 | AUTH_INVALID_CREDENTIALS | 이메일 없음, 비밀번호 틀림, 탈퇴 회원. 세 경우 모두 같은 응답 |

```json
{ "code": "AUTH_INVALID_CREDENTIALS", "message": "이메일 또는 비밀번호가 올바르지 않습니다" }
```

## 토큰 사용법

로그인이 필요한 API는 아래 헤더를 보냅니다.

```
Authorization: Bearer <accessToken>
```

| 토큰 내용 | 값 |
|---|---|
| `sub` | 회원 ID |
| `iat` | 생성 시각 |
| `exp` | 만료 시각 (생성 + 1시간) |

#### 에러 (로그인이 필요한 모든 API 공통)

| HTTP | 코드 | 상황 |
|---|---|---|
| 401 | AUTH_UNAUTHORIZED | 헤더 없음, `Bearer` 형식 아님, 서명 틀림, 만료 |

```json
{ "code": "AUTH_UNAUTHORIZED", "message": "로그인이 필요합니다" }
```

---

[이전: Flow](flows.md) | [문서 지도](../../README.md)
