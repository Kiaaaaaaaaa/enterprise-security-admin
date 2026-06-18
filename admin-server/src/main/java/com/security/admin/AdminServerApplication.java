package com.security.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdminServerApplication {
    public static void main(String[] args) {
        // Convert Render PostgreSQL url (postgres:// or postgresql://) to Java JDBC format (jdbc:postgresql://)
        // and extract username/password properties because standard JDBC driver does not support "user:password@" format.
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                // Ensure URI can parse it by normalizing scheme to postgresql
                String uriString = rawUrl;
                if (rawUrl.startsWith("postgres://")) {
                    uriString = rawUrl.replaceFirst("postgres://", "postgresql://");
                }
                
                java.net.URI uri = new java.net.URI(uriString);
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String query = uri.getQuery();
                
                String jdbcUrl = "jdbc:postgresql://" + host + (port != -1 ? ":" + port : "") + path;
                if (query != null) {
                    jdbcUrl += "?" + query;
                }
                
                System.setProperty("spring.datasource.url", jdbcUrl);
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
                
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    String username = parts[0];
                    String password = parts[1];
                    
                    System.setProperty("spring.datasource.username", username);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", username);
                    System.setProperty("spring.datasource.password", password);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", password);
                }
            } catch (Exception e) {
                System.err.println("Failed to parse SPRING_DATASOURCE_URL as URI: " + e.getMessage());
                // Fallback: simple replace
                String fallbackUrl = rawUrl.replaceFirst("^postgres(ql)?://", "jdbc:postgresql://");
                System.setProperty("spring.datasource.url", fallbackUrl);
                System.setProperty("SPRING_DATASOURCE_URL", fallbackUrl);
            }
        }
        
        SpringApplication.run(AdminServerApplication.class, args);
    }
}
