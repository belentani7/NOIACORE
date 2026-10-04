# BELENTANI OMEGA ULTRA
# Autoría: Pedro Belentani
# Fecha: 2026-08-14

# --- Build stage ---
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q -DskipTests package

# --- Run stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8099
EXPOSE 8099
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
