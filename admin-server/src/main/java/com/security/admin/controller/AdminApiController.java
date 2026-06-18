package com.security.admin.controller;

import com.security.admin.dto.SessionDto;
import com.security.admin.entity.AdminUser;
import com.security.admin.entity.AuditLog;
import com.security.admin.entity.CommonCode;
import com.security.admin.repository.AdminUserRepository;
import com.security.admin.repository.AuditLogRepository;
import com.security.admin.repository.CommonCodeRepository;
import com.security.admin.service.RedisSessionService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    @Autowired
    private RedisSessionService sessionService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private CommonCodeRepository commonCodeRepository;

    // 1. Initial Database Seed on Startup
    @PostConstruct
    public void initDatabase() {
        if (adminUserRepository.count() == 0) {
            // Seed Admin Users
            adminUserRepository.save(new AdminUser("admin", "최고 관리자", "SUPER_ADMIN", "정보보안본부", LocalDateTime.now()));
            adminUserRepository.save(new AdminUser("manager_kim", "김동현 팀장", "SEC_MANAGER", "인프라운영팀", LocalDateTime.now()));
            adminUserRepository.save(new AdminUser("operator_min", "민아름 주임", "SYSTEM_USER", "관제운영그룹", LocalDateTime.now()));
        }

        if (commonCodeRepository.count() == 0) {
            // Seed Common Codes
            commonCodeRepository.save(new CommonCode(null, "SYS_CONFIG", "SESSION_EXPIRY", "세션 만료 기한", "120", "활성 세션 주기 제한 시간(분)", "Y"));
            commonCodeRepository.save(new CommonCode(null, "SYS_CONFIG", "MAX_RETRY_LOGIN", "최대 로그인 시도", "5", "로그인 실패 시 차단 임계값", "Y"));
            commonCodeRepository.save(new CommonCode(null, "SYS_CONFIG", "HEARTBEAT_CYCLE", "에이전트 주기", "30", "C# client 상태보고 주기(초)", "Y"));

            commonCodeRepository.save(new CommonCode(null, "ROLE_TYPE", "SUPER_ADMIN", "최고 관리자", "A99", "모든 세션 통제 및 설정 변경 가능", "Y"));
            commonCodeRepository.save(new CommonCode(null, "ROLE_TYPE", "SEC_MANAGER", "보안 관리자", "A50", "감사 로그 관람 및 세션 갱신 가능", "Y"));
            commonCodeRepository.save(new CommonCode(null, "ROLE_TYPE", "SYSTEM_USER", "모니터링 유저", "U10", "조회 기능만 부여", "Y"));

            commonCodeRepository.save(new CommonCode(null, "CLIENT_VER", "MIN_ALLOWED_VER", "최소 허용 버전", "1.2.4", "이하 버전 접속 시 갱신 차단", "Y"));
            commonCodeRepository.save(new CommonCode(null, "CLIENT_VER", "CURR_BUILD_VER", "최신 배포 버전", "1.5.0", "현재 정식 릴리즈 C# 클라이언트", "Y"));
        }

        if (auditLogRepository.count() == 0) {
            // Seed Audit Logs
            auditLogRepository.save(new AuditLog(null, LocalDateTime.now().minusMinutes(5), "malicious_hack", "C# Client: 디버깅 도구 실행 감지", "SECURITY_WARN", "WinAPI CheckRemoteDebuggerPresent=True | x64dbg.exe", "45.138.22.109", "Windows 11 | MAC: 00-50-56-C0-00-08"));
            auditLogRepository.save(new AuditLog(null, LocalDateTime.now().minusMinutes(10), "manager_kim", "웹 통합 관리자 로그인 승인", "LOGIN", "ID/PW 인증성공 | 세션발급 완료", "211.234.56.90", "MacOS Sonoma | Safari 17.4"));
            auditLogRepository.save(new AuditLog(null, LocalDateTime.now().minusMinutes(20), "system_cron", "만료 세션 자동 삭제 스케줄러 작동", "SESSION_OP", "Redis EXPIRE 감지 | 2개 세션 제거", "127.0.0.1", "Redis Server Cluster Daemon"));
            auditLogRepository.save(new AuditLog(null, LocalDateTime.now().minusMinutes(35), "admin", "신규 관리 계정 생성 완료", "CONFIG", "신규 ID: auditor_lee | 권한 등급: SEC_MANAGER", "192.168.10.2", "Windows 11 | Chrome 125.0"));
        }

        // Initialize mock active sessions in Redis/LocalMap
        if (sessionService.getAllActiveSessions().isEmpty()) {
            sessionService.saveSession(new SessionDto("sess_f32ea891-b3b4-42f5-b9f1-d0b830ac9a34", "operator_min", "WPF", "192.168.10.15", "B4-2E-99-C1-88-EF", "Windows 10 Pro x64", "WPF Client Embedded", 120, "LOW", "ACTIVE"));
            sessionService.saveSession(new SessionDto("sess_a88190ce-1c4b-4b11-a8bb-e0f39ac8ccb1", "manager_kim", "WEB", "211.234.56.90", "E0-C9-A6-FD-11-22", "MacOS Sonoma v14.4", "Safari 17.4", 120, "MEDIUM", "ACTIVE"));
            sessionService.saveSession(new SessionDto("sess_d78f2441-fa1a-4c28-98e9-d7bc0d88ca12", "malicious_hack", "WPF", "45.138.22.109", "00-50-56-C0-00-08", "Windows 11 Enterprise x64", "x64dbg Debugger Process Attached", 120, "HIGH", "ACTIVE"));
        }
    }

    // 2. Server Health Check API
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("redis", "CONNECTED");
        status.put("db", "CONNECTED");
        return ResponseEntity.ok(status);
    }

    // ==========================================
    // SESSIONS API (Redis)
    // ==========================================
    @GetMapping("/sessions")
    public ResponseEntity<List<SessionDto>> getSessions() {
        return ResponseEntity.ok(sessionService.getAllActiveSessions());
    }

    @PostMapping("/sessions")
    public ResponseEntity<Void> createSession(@RequestBody SessionDto session) {
        if (session.getId() == null) {
            session.setId("sess_" + UUID.randomUUID().toString());
        }
        session.setExpiresIn(120);
        session.setStatus("ACTIVE");
        sessionService.saveSession(session);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sessions/{id}/renew")
    public ResponseEntity<Void> renewSession(@PathVariable String id) {
        sessionService.renewSessionTtl(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        sessionService.deleteSession(id);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // AUDIT LOGS API (JPA)
    // ==========================================
    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        List<Map<String, Object>> response = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        for (AuditLog log : logs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("timestamp", log.getTimestamp().format(formatter));
            map.put("userId", log.getUserId());
            map.put("action", log.getAction());
            map.put("actionCategory", log.getActionCategory());
            map.put("detail", log.getDetail());
            map.put("ip", log.getIp());
            map.put("pcInfo", log.getPcInfo());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/audit-logs")
    public ResponseEntity<Void> createAuditLog(@RequestBody AuditLog log) {
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // ADMIN USERS API (JPA)
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<AdminUser> users = adminUserRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        for (AdminUser user : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("role", user.getRole());
            map.put("dept", user.getDept());
            map.put("createdAt", user.getCreatedAt().format(formatter));
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users")
    public ResponseEntity<Void> createUser(@RequestBody AdminUser user) {
        user.setCreatedAt(LocalDateTime.now());
        adminUserRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // COMMON CODES API (JPA)
    // ==========================================
    @GetMapping("/codes")
    public ResponseEntity<List<CommonCode>> getCodes() {
        return ResponseEntity.ok(commonCodeRepository.findAll());
    }

    @PostMapping("/codes")
    public ResponseEntity<Void> createCode(@RequestBody CommonCode code) {
        commonCodeRepository.save(code);
        return ResponseEntity.ok().build();
    }
}
