# FarmKit – Contributor & Agent Guide (AGENTS.md)

This document defines how humans and AI agents should work on FarmKit.

FarmKit is a low-cost, open-source farm equipment maintenance tracking app designed for small and medium farms. The priorities are simplicity, reliability, low operating cost, and long-term maintainability.

---

## Core Principles

1. **Simple beats clever**
   - Prefer boring, readable solutions.
   - Avoid abstractions unless they clearly reduce complexity.

2. **MVP first**
   - Build the smallest useful thing.
   - Defer “nice to have” features unless explicitly requested.

3. **Safe by default**
   - Never assume access across farms.
   - Enforce permissions at the database level (RLS), not just the UI.

4. **Modular, not monolithic**
   - Features should be easy to enable/disable.
   - Future add-ons should not require rewriting core code.

5. **Farm-first UX**
   - Optimize for non-technical users.
   - Shared devices and shared accounts are valid use cases.

---

## Tech Stack (Authoritative)

- **Frontend:** React + Vite + TypeScript
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Hosting:**  
  - Frontend: Netlify or Vercel  
  - Backend: Supabase
- **Target:** PWA-friendly, mobile-first UI

Avoid introducing new frameworks or heavy dependencies unless approved.

---

## Local Development

### Frontend
- Use Vite dev server for all active development.
- Environment variables live in `.env.local` and are never committed.

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
