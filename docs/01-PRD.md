# PrayerHubApp — Product Requirements Document

## 1. Vision
PrayerHubApp is an audio-first Christian social platform where believers pray together in
real-time audio rooms, submit and respond to prayer requests, study Scripture in groups, and
build lasting Christian community — regardless of geography.

**Tagline:** Pray Together. Grow Together. Believe Together.

## 2. Five Pillars
1. **Pray** — individual and communal prayer
2. **Connect** — believers across geography
3. **Grow** — Bible study and spiritual development
4. **Fellowship** — meaningful Christian community
5. **Serve** — mutual encouragement and support

Design tone: peaceful, welcoming, trustworthy, modern, spiritually uplifting. Never corporate
or productivity-app in feel.

## 3. Primary Personas
- **New Believer Nia** — recently came to faith, wants approachable Bible study and a safe
  place to ask for prayer without judgment.
- **Prayer Warrior Daniel** — prays daily, wants to host recurring prayer rooms and lead a
  prayer group.
- **Group Leader Grace** — leads a cell group at her church, needs scheduling, attendance,
  and discussion tools.
- **Ministry Admin Pastor James** — runs a church account, wants a verified organizational
  presence, sermons, and multiple cell groups under one roof.
- **Moderator Ruth** — volunteers to keep the platform safe, needs a fast, clear moderation
  queue.

## 4. First-Release User Journey (North Star)
Download → Create account → Spiritual-interest onboarding → Discover Christians/communities →
Join a prayer group → Submit a prayer request → Receive "I prayed for you" responses → Join a
live audio prayer room → Raise hand → Pray with the community → Join a Bible study → Save
Scripture → Receive reminders → Return the next day.

Every Phase-1/2/3 decision is judged against whether it serves this journey.

## 5. Feature Matrix (MVP → Later)

| Feature | Phase | MVP? |
|---|---|---|
| Auth (email/phone/Google/Apple) | 1 | Yes |
| Onboarding + interests | 1 | Yes |
| Profiles + RBAC | 1 | Yes |
| Prayer requests + "I Prayed" | 2 | Yes |
| Prayer journal | 2 | Yes |
| Notifications (basic) | 2 | Yes |
| Live audio rooms | 3 | Yes |
| Prayer groups | 4 | Yes |
| Cell groups | 4 | Later |
| Bible study groups | 5 | Later |
| Bible integration | 5 | Yes (read-only) |
| Social feed / audio posts | 6 | Later |
| Messaging | 6 | Later |
| Church/ministry hubs | 7 | Later |
| PrayerHub AI Assistant | 8 | Later |

## 6. Non-negotiable constraints
- No fake buttons, no mock auth in production, no secrets in source.
- Private prayer content never surfaces in public search, analytics, or AI retrieval.
- AI output is never presented as Scripture, prophecy, or divine revelation.
- Youth-safety and privacy are launch requirements, not follow-ups.
