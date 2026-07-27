# Single-container build for hosting (Render, Fly, Cloud Run, ...).
#
# Local development uses docker-compose.yml instead, which runs the frontend behind nginx as a
# separate service. Here the React bundle is baked into the jar so the whole app is one
# deployable listening on one port -- which is what most platforms' free tiers expect, and it
# means the API and the SPA share an origin with no CORS configuration.

# 1. Build the React bundle.
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build the Spring Boot jar with the bundle inside it.
FROM gradle:8.14-jdk21 AS backend
WORKDIR /workspace
COPY settings.gradle ./
COPY backend/build.gradle backend/build.gradle
RUN gradle :backend:dependencies --no-daemon > /dev/null 2>&1 || true

COPY backend/src backend/src
# Spring Boot serves anything under resources/static; SpaConfig adds the SPA fallback.
COPY --from=frontend /frontend/dist backend/src/main/resources/static
RUN gradle :backend:bootJar --no-daemon

# 3. Runtime: JRE only.
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring
COPY --from=backend /workspace/backend/build/libs/app.jar app.jar

# The platform overrides this via $PORT; 8080 is only the local default.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
