# Liquidity Manager

Pulls live US Treasury yield data, plots the yield curve, and lets a user submit orders and
view their order history.

Java 21 / Spring Boot 3.5 · React 18 + TypeScript (Vite) · PostgreSQL 16 · Docker Compose

## Run

Requires Docker. The JDK, Gradle and Node all run inside the build containers, so nothing else
needs to be installed.

```bash
docker compose up --build
```

- Web app: <http://localhost:5173>
- API: <http://localhost:8080>

Stop with `Ctrl-C`, then `docker compose down` (add `-v` to also drop the database).

## What it does

**Yield curve** — the current par yield curve from the US Treasury, charted with the exact
rates in a table below it. The **curve year** selector goes back to 1990, so you can compare
today's curve against, say, 2020's near-zero one. Historical years disable order entry, since
orders always book at the current published rate.

**Place an order** — pick a term and an amount. The term options come from the live curve, and
the **server** looks up the rate rather than trusting the client, so the recorded rate is the
one actually published for that term at that moment.

**Order history** — paginated, newest first, showing the rate booked at the time.

The selected curve year and history page live in the URL (`/orders?page=1`, `/?year=2020`), so
links are shareable and the back button works.

### The demo user selector

There is **no authentication**. The picker in the header switches between three seeded demo
users so per-user order history is visible; the selection is sent as an `X-User-Id` header and
is trivially spoofable. It exists to demonstrate the data model, not to secure anything.

Identity is resolved in exactly one place (`CurrentUser`), and `userId` is never accepted in a
request body — so adding real authentication means changing that one method to read the
authenticated principal, with no change to the API, the repository queries or the frontend.

## Local development

Requires JDK 21 and Node 20+.

```bash
docker compose up -d postgres               # database only
./gradlew :backend:bootRun                  # API on :8080
cd frontend && npm install && npm run dev   # web app on :5173, proxies /api to :8080
```

Backend tests run against in-memory H2, so no database is needed:

```bash
./gradlew :backend:test
```

> Note: don't run the Vite dev server and the frontend container at the same time. Both bind
> port 5173 (Vite on `::1`, Docker on the wildcard), so which one answers depends on whether
> the request resolves to IPv6 or IPv4.

## Layout

```
├── backend/                     # Spring Boot API
│   └── src/main/java/com/project/liquidity/
│       ├── yields/              # Treasury client, CSV parsing, /api/yield-curve
│       ├── orders/              # entity, repository, /api/orders
│       ├── users/               # CurrentUser — the single identity seam
│       └── web/                 # error responses
└── frontend/                    # React + TypeScript
    ├── nginx.conf               # serves the SPA, proxies /api, gzip + cache headers
    └── src/
        ├── api/                 # typed fetch wrappers
        ├── components/, pages/  # UI
        └── router.tsx           # TanStack Router, typed search params
```

nginx serves the built bundle and reverse-proxies `/api` to the backend, so the browser only
ever talks to one origin and no CORS configuration is needed.

## Notes on the implementation

**Data source.** Yields come from the Treasury's daily par yield curve CSV on
[home.treasury.gov](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve),
which needs no API key.

Tenor columns vary by era: 2026 publishes 14 (including an odd "1.5 Month"), 2020 has 12, 1995
has 10. The parser reads the header row rather than assuming a fixed set, so every year works
without special cases.

**Money** is `BigDecimal` throughout and never `double`. Amounts are rejected above two decimal
places rather than silently rounded.

**Curve caching.** Completed years never change, so they're cached indefinitely; the current
year has a 15-minute TTL. This matters because placing an order reads the curve.

**Tests** — 27 backend tests covering CSV parsing (including fractional tenors and blank
cells), rate snapshotting, validation, per-user scoping, and pagination boundaries.

## out of scope/potential future work

- **Authentication** — the seam is in place but no credentials, sessions or password
  handling.
- **Code splitting** — recharts and the router ship in one chunk.
- **Historical time series** — you can view any year's closing curve, but not one tenor plotted
  over time.
