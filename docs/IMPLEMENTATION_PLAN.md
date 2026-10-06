# B2C — Phase 8 notes

**Status:** Phase 8 COMPLETED (local verification)

## Dynamic from public config

- Website name / tagline / SEO / favicon
- Effective service tabs (flight/hotel/bus when offered)
- Footer groups + contact + social
- Testimonials
- Home hero title (optional HOME_HERO banner)
- `/pages/[slug]`, `/blogs`, `/blogs/[slug]`

## Origins

- `BACKEND_ORIGIN` — travel/auth/bookings (keep Render)
- `PUBLIC_SITE_ORIGIN` — optional local public site/CMS (`http://127.0.0.1:3000`)

## Fallback

- Unresolved tenant → legacy static branding/services for single-brand continuity
- Resolved tenant → services never fail open to static catalogue
