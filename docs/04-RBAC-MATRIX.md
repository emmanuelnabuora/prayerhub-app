# RBAC Matrix

Roles are scoped: **platform** (applies everywhere), **group** (applies within one group), or
**organization** (applies within one church/ministry). A user can hold different roles in
different scopes simultaneously (e.g., `member` platform-wide, `leader` in one group).

| Action | Member | Group Leader | Prayer Host | Ministry | Moderator | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create prayer request | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create prayer group | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage own group (settings, members) | — | ✅ (own) | — | ✅ (own) | — | ✅ | ✅ |
| Create/host live room | ✅ (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mute/remove in own room | — | — | ✅ (own room) | ✅ (own room) | ✅ | ✅ | ✅ |
| Verify organization | — | — | — | — | — | ✅ | ✅ |
| View moderation queue | — | — | — | — | ✅ | ✅ | ✅ |
| Resolve reports | — | — | — | — | ✅ | ✅ | ✅ |
| Ban/suspend user | — | — | — | — | — | ✅ | ✅ |
| Access admin dashboard | — | — | — | — | ✅ (queue only) | ✅ | ✅ |
| Modify platform roles | — | — | — | — | — | — | ✅ |
| View any user's private prayer content | — | — | — | — | ❌ never | ❌ never | ❌ never* |

\* Even Super Admin does not get a UI path to read private-visibility prayer request bodies;
moderation of private content is limited to metadata (report reason, reporter, timestamps)
unless the content was reported and explicitly shared by the reporter for review.

Enforcement: every mutating endpoint has a NestJS `@Roles()` guard checked against
`user_roles` for the relevant scope; every read query additionally filters by
`visibility`/ownership at the repository layer so a missing guard can't leak data.
