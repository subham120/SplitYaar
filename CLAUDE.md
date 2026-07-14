## Project Context — Read First

This project is **SplitYatra**: a mobile-first trip/roommate expense splitter for Indian friend groups (₹/INR, UPI-based settlement, no login required). Before writing any code, read the full planning doc set in `docs/`, in this order:

1. `docs/prd.md` — Product Requirements: what we're building and why, features, scope, non-goals
2. `docs/trd.md` — Technical Requirements: stack, architecture, algorithms (split calculation, greedy debt-settlement), API shape
3. `docs/appflow.md` — Every screen and user journey, edge cases, sitemap
4. `docs/design.md` — Visual design system (Apple-inspired tokens: colors, typography, spacing, components) — same file as `DESIGN.md` at repo root
5. `docs/schema.md` — Data model (Trip, Member, Expense, ExpenseShare), TypeScript interfaces, SQL DDL, validation rules
6. `docs/implementation.md` — Phased build plan (Phase 0–7) to follow in order
7. `docs/tracker.md` — Live status tracker; update task status here as work is completed
8. `docs/rules.md` — Coding conventions and guardrails (money-in-paise handling, IST dates, mobile-first, security/privacy rules) — treat as binding alongside this file

**Do not deviate from these docs without updating them in the same change.** If `tracker.md` says a task isn't started, don't assume prior work exists. If a technical decision isn't covered by these docs, flag it as an open question rather than improvising architecture.

Always Use:
- astro, tailwind, web-design-guidelines these 3 skills for this project
- DESIGN.md (or `docs/design.md`) for this project's visual design system




## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
