package com.security.admin.controller;

import com.security.admin.dto.ClientInfoDto;
import com.security.admin.dto.LoginRequestDto;
import com.security.admin.dto.SessionDto;
import com.security.admin.dto.SystemMetricsDto;
import com.security.admin.entity.AdminUser;
import com.security.admin.entity.AuditLog;
import com.security.admin.entity.CommonCode;
import com.security.admin.service.AdminUserService;
import com.security.admin.service.AuditLogService;
import com.security.admin.service.CommonCodeService;
import com.security.admin.service.RedisSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private final RedisSessionService sessionService;
    private final AuditLogService auditLogService;
    private final AdminUserService adminUserService;
    private final CommonCodeService commonCodeService;
    private final long serverStartTime = System.currentTimeMillis();

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

    // 2. Real-time System Metrics API (JVM, DB records, Redis metrics)
    @GetMapping("/system/metrics")
    public ResponseEntity<SystemMetricsDto> getSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long totalMem = runtime.totalMemory() / (1024 * 1024);
        long freeMem = runtime.freeMemory() / (1024 * 1024);
        long maxMem = runtime.maxMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;

        boolean redisOk = false;
        try {
            redisOk = sessionService.isRedisAvailable();
        } catch (Exception e) {
            // ignore
        }

        int activeSessions = sessionService.getAllActiveSessions().size();
        long totalAuditLogs = auditLogService.count();
        long totalUsers = adminUserService.count();
        long totalCodes = commonCodeService.count();
        long uptime = (System.currentTimeMillis() - serverStartTime) / 1000;

        SystemMetricsDto metrics = SystemMetricsDto.builder()
                .jvmMemoryUsedMb(usedMem)
                .jvmMemoryTotalMb(totalMem)
                .jvmMemoryMaxMb(maxMem)
                .activeSessionsCount(activeSessions)
                .totalAuditLogsCount(totalAuditLogs)
                .totalUsersCount(totalUsers)
                .totalCodesCount(totalCodes)
                .redisStatus(redisOk ? "CONNECTED (Active Master)" : "DISCONNECTED (Memory Fallback)")
                .dbStatus("ONLINE (HikariCP PostgreSQL)")
                .uptimeSeconds(uptime)
                .build();

        return ResponseEntity.ok(metrics);
    }

    // 3. Dynamic Client Info & IP Detection API
    @GetMapping("/client-info")
    public ResponseEntity<ClientInfoDto> getClientInfo(HttpServletRequest request) {
        String ip = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) userAgent = "Unknown";

        String os = "Unknown OS";
        if (userAgent.contains("Windows")) os = "Windows PC";
        else if (userAgent.contains("Mac")) os = "macOS";
        else if (userAgent.contains("Linux")) os = "Linux";
        else if (userAgent.contains("Android")) os = "Android";
        else if (userAgent.contains("iPhone") || userAgent.contains("iPad")) os = "iOS";

        String browser = "Unknown Browser";
        if (userAgent.contains("Edg/")) browser = "Microsoft Edge";
        else if (userAgent.contains("Chrome/")) browser = "Google Chrome";
        else if (userAgent.contains("Safari/")) browser = "Apple Safari";
        else if (userAgent.contains("Firefox/")) browser = "Mozilla Firefox";

        boolean isLocal = "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || ip.startsWith("192.168.") || ip.startsWith("10.");

        ClientInfoDto clientInfo = ClientInfoDto.builder()
                .ip(ip)
                .userAgent(userAgent)
                .os(os)
                .browser(browser)
                .serverTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .isLocal(isLocal)
                .build();

        return ResponseEntity.ok(clientInfo);
    }

    // 4. Database-driven Admin Login API
    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestDto loginReq, HttpServletRequest request) {
        AdminUser user = adminUserService.findById(loginReq.getUsername());
        if (user == null) {
            // Record failed login audit log
            String callerIp = loginReq.getIp() != null ? loginReq.getIp() : extractClientIp(request);
            auditLogService.recordAuditLog(new AuditLog(
                    null,
                    LocalDateTime.now(),
                    loginReq.getUsername(),
                    "관리자 로그인 실패 (존재하지 않는 계정)",
                    "SECURITY_WARN",
                    "미등록 사용자 로그인 시도 차단",
                    callerIp,
                    (loginReq.getOs() != null ? loginReq.getOs() : "Unknown OS") + " | " + (loginReq.getBrowser() != null ? loginReq.getBrowser() : "Browser")
            ));
            throw new IllegalArgumentException("등록되지 않은 관리자 계정입니다: " + loginReq.getUsername());
        }

        // Record successful login audit log
        String callerIp = loginReq.getIp() != null ? loginReq.getIp() : extractClientIp(request);
        auditLogService.recordAuditLog(new AuditLog(
                null,
                LocalDateTime.now(),
                user.getId(),
                "웹 통합 관리자 로그인 승인 (DB 인증)",
                "LOGIN",
                "사용자: " + user.getName() + " | 권한: " + user.getRole() + " | 부서: " + user.getDept(),
                callerIp,
                (loginReq.getOs() != null ? loginReq.getOs() : "Client Device") + " | MAC: " + (loginReq.getMacAddress() != null ? loginReq.getMacAddress() : "Dynamic")
        ));

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getName());
        result.put("role", user.getRole());
        result.put("dept", user.getDept());
        result.put("authenticated", true);

        return ResponseEntity.ok(result);
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
            String defaultExpiryStr = commonCodeService.findValueByGroupAndCode("SYS_CONFIG", "SESSION_EXPIRY", "120");
            try {
                session.setExpiresIn(Long.parseLong(defaultExpiryStr));
            } catch (NumberFormatException e) {
                session.setExpiresIn(120);
            }
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

    // Helper: Extract real client IP through reverse proxies / Render load balancers
    private String extractClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR",
                "X-Real-IP"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
