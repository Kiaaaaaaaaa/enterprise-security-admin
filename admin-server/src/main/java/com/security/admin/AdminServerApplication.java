package com.security.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdminServerApplication {
    public static void main(String[] args) {
        // Convert Render PostgreSQL url (postgres://) to Java JDBC format (jdbc:postgresql://)
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl != null && rawUrl.startsWith("postgres://")) {
            String jdbcUrl = rawUrl.replace("postgres://", "jdbc:postgresql://");
            System.setProperty("spring.datasource.url", jdbcUrl);
        }
        
        SpringApplication.run(AdminServerApplication.class, args);
    }
}
