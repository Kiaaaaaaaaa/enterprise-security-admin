package com.security.admin.controller;

import com.security.admin.dto.SessionDto;
import com.security.admin.entity.AdminUser;
import com.security.admin.entity.AuditLog;
import com.security.admin.entity.CommonCode;
import com.security.admin.service.AdminUserService;
import com.security.admin.service.AuditLogService;
import com.security.admin.service.CommonCodeService;
import com.security.admin.service.RedisSessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private final RedisSessionService sessionService;
    private final AuditLogService auditLogService;
    private final AdminUserService adminUserService;
    private final CommonCodeService commonCodeService;

    @Autowired
    public AdminApiController(RedisSessionService sessionService,
                              AuditLogService auditLogService,
                              AdminUserService adminUserService,
                              CommonCodeService commonCodeService) {
        this.sessionService = sessionService;
        this.auditLogService = auditLogService;
        this.adminUserService = adminUserService;
        this.commonCodeService = commonCodeService;
    }

    // 1. Server Health Check API
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        
        boolean redisOk = false;
        try {
            redisOk = sessionService.isRedisAvailable();
        } catch (Exception e) {
            // ignore
        }
        
        status.put("redis", redisOk ? "CONNECTED" : "DISCONNECTED (Fallback to Memory)");
        status.put("db", "CONNECTED");
        return ResponseEntity.ok(status);
    }

    // ==========================================
    // SESSIONS API (Redis Session Clustering)
    // ==========================================
    @GetMapping("/sessions")
    public ResponseEntity<List<SessionDto>> getSessions() {
        return ResponseEntity.ok(sessionService.getAllActiveSessions());
    }

    @PostMapping("/sessions")
    public ResponseEntity<Void> createSession(@Valid @RequestBody SessionDto session) {
        if (session.getId() == null || session.getId().trim().isEmpty()) {
            session.setId("sess_" + UUID.randomUUID().toString());
        }
        if (session.getExpiresIn() <= 0) {
            session.setExpiresIn(120);
        }
        if (session.getStatus() == null) {
            session.setStatus("ACTIVE");
        }
        sessionService.saveSession(session);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/sessions/{id}/renew")
    public ResponseEntity<Void> renewSession(@PathVariable String id) {
        sessionService.renewSessionTtl(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // AUDIT LOGS API (PostgreSQL / JPA)
    // ==========================================
    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getFormattedAuditLogs());
    }

    @PostMapping("/audit-logs")
    public ResponseEntity<Void> createAuditLog(@RequestBody AuditLog log) {
        auditLogService.recordAuditLog(log);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ==========================================
    // ADMIN USERS API (PostgreSQL / JPA)
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsersFormatted());
    }

    @PostMapping("/users")
    public ResponseEntity<Void> createUser(@RequestBody AdminUser user) {
        adminUserService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ==========================================
    // COMMON CODES API (PostgreSQL / JPA)
    // ==========================================
    @GetMapping("/codes")
    public ResponseEntity<List<CommonCode>> getCodes() {
        return ResponseEntity.ok(commonCodeService.getAllCodes());
    }

    @PostMapping("/codes")
    public ResponseEntity<Void> createCode(@RequestBody CommonCode code) {
        commonCodeService.saveCode(code);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
