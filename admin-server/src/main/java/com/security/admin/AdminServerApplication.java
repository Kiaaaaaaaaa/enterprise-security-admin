package com.security.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdminServerApplication {
    public static void main(String[] args) {
        // Convert Render PostgreSQL url (postgres:// or postgresql://) to Java JDBC format (jdbc:postgresql://)
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl != null) {
            String jdbcUrl = null;
            if (rawUrl.startsWith("postgres://")) {
                jdbcUrl = rawUrl.replace("postgres://", "jdbc:postgresql://");
            } else if (rawUrl.startsWith("postgresql://")) {
                jdbcUrl = rawUrl.replace("postgresql://", "jdbc:postgresql://");
            }
            
            if (jdbcUrl != null) {
                System.setProperty("spring.datasource.url", jdbcUrl);
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
            }
        }
        
        SpringApplication.run(AdminServerApplication.class, args);
    }
}
