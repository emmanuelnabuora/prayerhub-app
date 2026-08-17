# API Spec — v1 (Phase 1–2 slice)

Base: `/api/v1`. All responses: `{ data, meta? }` on success, `{ error: { code, message } }`
on failure. Pagination: `?page=&limit=` with `meta.total`/`meta.hasMore`.

## Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | none | email/phone + password |
| POST | `/auth/login` | none | returns access + refresh token |
| POST | `/auth/oauth/google` | none | id_token exchange |
| POST | `/auth/oauth/apple` | none | id_token exchange |
| POST | `/auth/refresh` | refresh token | rotates refresh token |
| POST | `/auth/logout` | access token | revokes current session |
| POST | `/auth/verify-email` | none | token from email |
| POST | `/auth/verify-phone` | none | OTP code |
| POST | `/auth/password/forgot` | none | sends reset email |
| POST | `/auth/password/reset` | none | token + new password |
| DELETE | `/auth/account` | access token | soft-deletes account |

## Users
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users/me` | required | current profile + roles |
| PATCH | `/users/me` | required | update profile/onboarding fields |
| GET | `/users/:id` | required | public profile (visibility-aware) |
| POST | `/users/:id/follow` | required | |
| DELETE | `/users/:id/follow` | required | |
| POST | `/users/:id/block` | required | |

## Prayer Requests
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/prayers` | required | feed, filtered by visibility + relationships |
| POST | `/prayers` | required | create; enforces visibility enum |
| GET | `/prayers/:id` | required | 403 if not visible to caller |
| PATCH | `/prayers/:id` | required (owner) | |
| DELETE | `/prayers/:id` | required (owner/mod) | soft delete |
| POST | `/prayers/:id/pray` | required | "I Prayed" — idempotent per user |
| GET | `/prayers/:id/comments` | required | |
| POST | `/prayers/:id/comments` | required | rate-limited |

## Prayer Journal (private)
| Method | Path | Auth |
|---|---|---|
| GET | `/journal` | required (own only) |
| POST | `/journal` | required |
| PATCH | `/journal/:id` | required (owner) |
| POST | `/journal/:id/mark-answered` | required (owner) |
| POST | `/journal/:id/convert-to-testimony` | required (owner) |

## Groups
| Method | Path | Auth |
|---|---|---|
| GET | `/groups` | required — discovery, filtered by visibility |
| POST | `/groups` | required |
| GET | `/groups/:id` | required (membership-aware for private) |
| POST | `/groups/:id/join` | required |
| POST | `/groups/:id/invite` | required (leader/mod) |
| PATCH | `/groups/:id/members/:userId` | required (leader) — role change/remove |

## Notifications
| Method | Path | Auth |
|---|---|---|
| GET | `/notifications` | required |
| POST | `/notifications/:id/read` | required |
| PATCH | `/notifications/preferences` | required |

## Reports / Moderation
| Method | Path | Auth |
|---|---|---|
| POST | `/reports` | required |
| GET | `/admin/moderation/queue` | moderator+ |
| POST | `/admin/moderation/:caseId/resolve` | moderator+ |

Every write is validated with a class-validator DTO; all list endpoints are paginated and
rate-limited; all admin/moderator endpoints write to `audit_logs`.
