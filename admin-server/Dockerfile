# Build stage using Maven and JDK 17
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage using OpenJDK 17
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/admin-server-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
