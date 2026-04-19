# Tripza

**Tripza** is a calm, modern travel marketplace for discovering vehicles, listing your own, and sharing trips with other travelers. The product is built around **human coordination**: travelers and hosts connect by **phone or WhatsApp** when they are ready. There is **no in-app card checkout or payment processing**—the app focuses on discovery, requests, messaging, and a simple record of status (for example, “contacted” or “booked” off-app).

Repository: [https://github.com/issac8080/Tripza](https://github.com/issac8080/Tripza)

---

## Table of contents

1. [What Tripza does](#what-tripza-does)
2. [Product features](#product-features)
3. [Who it is for](#who-it-is-for)
4. [Tech stack](#tech-stack)
5. [Repository layout](#repository-layout)
6. [Prerequisites](#prerequisites)
7. [Local development](#local-development)
8. [Environment variables](#environment-variables)
9. [Firebase and Firestore](#firebase-and-firestore)
10. [Useful scripts](#useful-scripts)
11. [API overview](#api-overview)
12. [Security and privacy notes](#security-and-privacy-notes)
13. [License](#license)

---

## What Tripza does

- **Vehicle marketplace**: Browse approved vehicle listings (bikes, cars, jeeps, travellers, buses) with details and pricing hints. Travelers reach hosts outside the app when they want to proceed.
- **Provider listings**: Signed-in providers can **add vehicles** so others can discover them. Vehicles move through statuses such as draft, pending approval, active, and inactive (see code enums for the exact lifecycle).
- **Shared trips**: Post a trip (route, seats, timing) or browse **open trip posts**. Others can express interest; providers can make **offers**; join requests tie the workflow together.
- **Bookings (record + estimate)**: Travelers can create **booking requests** against active vehicles with hourly, daily, or multi-day types. The backend **estimates** totals from vehicle rates; **instant** vs **request** modes affect initial status. Final arrangements happen off-app; statuses like **CONTACTED** and **BOOKED** reflect that.
- **Realtime chat**: **Socket.IO** powers messaging between users (see `RealtimeChat` and backend socket registration).
- **Reviews**: Users can leave feedback tied to vehicles (subject to your rules in the API and UI).
- **Admin**: Admin-only routes for moderation and operational tasks (seed script available for bootstrap admin).
- **Account and profile**: Register and log in with **email or phone** and password; JWT-backed sessions for API calls; profile and preferences (including language hints in the domain model).
- **Progressive Web App hints**: `frontend/public/manifest.json` names the app **Tripza** with standalone display and theme colors for installable / mobile-friendly behavior.

The marketing line on the home page sums it up: *Find a ride, list a vehicle, or share a trip*—with **Travel, simplified**.

---

## Product features

| Area | What users get |
|------|----------------|
| **Home** | Hero, feature cards, **search by place, route, or landmark**, quick links to vehicles, post trip, and add vehicle. Shows **API health** when `NEXT_PUBLIC_API_URL` is configured. |
| **Vehicles** | List and filter browse experience; **vehicle detail** pages with host contact options (phone / WhatsApp as implemented). |
| **Search** | Dedicated search experience wired to listings / discovery. |
| **Post trip** | Form to publish shared trips (seats, route, notes). |
| **Trips** | Browse **trip posts**; **trip detail** with join / offer flows as enabled by the backend. |
| **My trips** | Trips **you** posted. |
| **Activity** | Inbox-style view for **requests, messages, and trip-related activity**. |
| **Bookings** | Traveler-centric booking list and flows (estimates, statuses). |
| **Chat** | Realtime threads for coordination. |
| **Reviews** | Vehicle-linked reviews list and submission UI. |
| **Provider** | Provider home and **add vehicle** flow. |
| **Profile** | Account details and settings entry points. |
| **Auth** | Register, login, token storage for API (`AuthProvider`, `authToken` helpers). |
| **Legal / trust** | **Terms**, **privacy**, cookie consent, trust notices, and footer navigation for compliance-oriented UX. |
| **Admin UI** | Front-end **admin** section for privileged operations (backed by admin API routes). |
| **Navigation** | Responsive **desktop** nav, **mobile drawer**, and **bottom nav** for small screens. |

Non-goals (by design today): **No native in-app payments**, no card vault, and no automated payout—those would be separate product decisions.

---

## Who it is for

- **Travelers** looking for local transport options or a seat on a shared trip.
- **Drivers / small operators (“providers”)** who want visibility without running their own website.
- **Operators** who may later use **admin** tools for approvals and support.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Web app** | [Next.js](https://nextjs.org/) (App Router), React 19, TypeScript, Tailwind CSS |
| **API** | [Express](https://expressjs.com/) 5, TypeScript, [Zod](https://zod.dev/) for validation |
| **Database** | [Firebase Admin](https://firebase.google.com/docs/admin/setup) + **Cloud Firestore** |
| **Realtime** | [Socket.IO](https://socket.io/) (server + `socket.io-client`) |
| **Auth** | Custom email/phone + password, **bcrypt** hashing, **JWT** for API authorization |
| **Tooling** | npm **workspaces** (`frontend`, `backend`) |

---

## Repository layout

```
Tripza/
├── README.md                 # This file
├── package.json              # Root workspaces + convenience scripts
├── firebase.json             # Firebase project config (e.g. Firestore indexes path)
├── firestore.indexes.json    # Composite indexes for Firestore queries
├── frontend/                 # Next.js application
│   ├── src/app/              # Routes (pages)
│   ├── src/components/       # UI, layout, Tripza design system pieces
│   └── public/manifest.json  # PWA manifest (name: Tripza)
└── backend/                  # Express API + Firestore data access
    ├── src/routes/v1/        # REST API routers
    ├── src/firestore/        # Firestore collections access layer
    ├── src/socket/           # Socket.IO wiring
    └── scripts/seed-admin.ts # Optional admin bootstrap
```

---

## Prerequisites

- **Node.js** (LTS recommended; matches Next 16 / React 19 expectations)
- **npm** (ships with Node)
- A **Firebase project** with **Firestore** enabled
- A **Firebase service account** JSON for the **Admin SDK** (server only—never expose in the browser)

---

## Local development

From the repository root:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** (see next section). Place your Firebase Admin key file in `backend/` as `firebase-service-account.local.json` **or** set `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT_JSON` in `backend/.env`.

3. **Start the API** (port **4000** by default)

   ```bash
   npm run dev:api
   ```

4. **Start the web app** (port **3000** by default)

   ```bash
   npm run dev:web
   ```

5. Open **http://localhost:3000** in the browser.

The home page shows **Service status: Connected** when the frontend can reach `GET /api/v1/health` on your API.

---

## Environment variables

### Backend (`backend/.env` or repo-root `.env` as supported by `env.ts`)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Signing secret for JWTs (minimum length enforced in code) |
| `PORT` | API port (default **4000**) |
| `CORS_ORIGIN` | Comma-separated browser origins allowed for CORS (and Socket.IO default origin behavior) |
| `NODE_ENV` | `development` \| `test` \| `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternative: inline JSON string for the service account |

**Important:** `NEXT_PUBLIC_FIREBASE_*` web client keys are **not** a substitute for the Admin SDK on the server.

### Frontend

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata / absolute links where used |

Firebase **client** config for the browser lives under `frontend/src/lib/firebase/` as expected by the Firebase JS SDK.

---

## Firebase and Firestore

- **Indexes**: Deploy or sync composite indexes from `firestore.indexes.json` using the Firebase CLI so list queries on vehicles, trip posts, offers, bookings, messages, and reviews stay fast.
- **Rules**: Configure Firestore security rules in the Firebase console to match your threat model. The backend uses **Admin SDK** privileges; the web app may use client SDK for specific features—align rules with that split.

---

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Next.js dev server (`frontend`) |
| `npm run dev:api` | Express API with watch (`backend`) |
| `npm run seed` | Runs backend seed script (e.g. admin bootstrap) |

In each workspace you can also run `npm run build`, `npm start`, and `npm run lint` (frontend) per `package.json`.

---

## API overview

Base path: **`/api/v1`**

Routers (see `backend/src/routes/v1/index.ts`):

- **`/health`** — Liveness / connectivity check
- **`/auth`** — Registration, login, session-related operations
- **`/vehicles`** — Vehicle CRUD and listing (with approval / status semantics)
- **`/trip-posts`** — Shared trip posts
- **`/join-requests`** and nested **`/trip-posts/:id/join-requests`** — Join workflow
- **`/trip-posts/:id/offers`** — Provider offers on a trip
- **`/bookings`** — Booking creation and lifecycle
- **`/messages`** — Messaging (pairs with Socket.IO for realtime)
- **`/reviews`** — Reviews
- **`/admin`** — Admin-only operations

Exact payloads and responses are defined in the route files and Zod schemas next to each handler.

---

## Security and privacy notes

- **Never commit** `firebase-service-account.local.json`, `serviceAccount.json`, or `*-firebase-adminsdk-*.json`. They are listed in `.gitignore`.
- Rotate **`JWT_SECRET`** and Firebase keys if they leak.
- Use **HTTPS** in production; set **`CORS_ORIGIN`** to your real web origins only.
- Treat **phone numbers and email** as PII; disclose handling in your **privacy** page and operational practices.

---

## License

This project is licensed under the **MIT License**—see the `LICENSE` file in the GitHub repository when published there.

---

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/issac8080/Tripza). For larger changes, open an issue first so direction stays aligned with the product’s “coordinate off-app” model.
