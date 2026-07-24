# Liquidity Manager

Pulls US Treasury yield data, plots the yield curve, and lets a user submit orders and
view their order history.

Java 21 / Spring Boot · React + TypeScript · PostgreSQL · Docker Compose

## Run

Requires Docker.

```bash
docker compose up --build
```

- Web app: <http://localhost:5173>
- API: <http://localhost:8080>

Stop with `Ctrl-C`, then `docker compose down`.

## Local development

Requires JDK 21 and Node 20+.

```bash
docker compose up -d postgres               # database only
./gradlew :backend:bootRun                  # API on :8080
cd frontend && npm install && npm run dev   # web app on :5173
```
