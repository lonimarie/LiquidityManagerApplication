# Build stage: compile the Spring Boot jar with Gradle inside the image so the
# only tool a reviewer needs on their machine is Docker.
FROM gradle:8.14-jdk21 AS build
WORKDIR /workspace

# Copy build scripts first so dependency resolution is cached across code changes.
COPY settings.gradle ./
COPY backend/build.gradle backend/build.gradle
RUN gradle :backend:dependencies --no-daemon > /dev/null 2>&1 || true

COPY backend/src backend/src
RUN gradle :backend:bootJar --no-daemon

# Runtime stage: JRE only, no Gradle or source.
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring

COPY --from=build /workspace/backend/build/libs/app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
