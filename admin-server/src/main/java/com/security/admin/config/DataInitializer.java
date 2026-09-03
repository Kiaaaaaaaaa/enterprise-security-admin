package com.security.admin.config;

import com.security.admin.dto.SessionDto;
import com.security.admin.entity.AdminUser;
import com.security.admin.entity.AuditLog;
import com.security.admin.entity.CommonCode;
import com.security.admin.service.AdminUserService;
import com.security.admin.service.AuditLogService;
import com.security.admin.service.CommonCodeService;
import com.security.admin.service.RedisSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final AdminUserService adminUserService;
    private final CommonCodeService commonCodeService;
    private final AuditLogService auditLogService;
    private final RedisSessionService sessionService;

    @Autowired
    public DataInitializer(AdminUserService adminUserService,
                           CommonCodeService commonCodeService,
                           AuditLogService auditLogService,
                           RedisSessionService sessionService) {
        this.adminUserService = adminUserService;
        this.commonCodeService = commonCodeService;
        this.auditLogService = auditLogService;
        this.sessionService = sessionService;
    }

    @Override
    public void run(String... args) {
        log.info("Initializing security admin portal seed data...");

        // 1. Seed Admin Users
        if (adminUserService.count() == 0) {
            log.info("Seeding default admin user accounts...");
            adminUserService.createUser(new AdminUser("admin", "최고 관리자", "SUPER_ADMIN", "정보보안본부", LocalDateTime.now()));
            adminUserService.createUser(new AdminUser("manager_kim", "김동현 팀장", "SEC_MANAGER", "인프라운영팀", LocalDateTime.now()));
            adminUserService.createUser(new AdminUser("operator_min", "민아름 주임", "SYSTEM_USER", "관제운영그룹", LocalDateTime.now()));
        }

        // 2. Seed Common Codes
        if (commonCodeService.count() == 0) {
            log.info("Seeding common configuration codes...");
            commonCodeService.saveCode(new CommonCode(null, "SYS_CONFIG", "SESSION_EXPIRY", "세션 만료 기한", "120", "활성 세션 주기 제한 시간(분)", "Y"));
            commonCodeService.saveCode(new CommonCode(null, "SYS_CONFIG", "MAX_RETRY_LOGIN", "최대 로그인 시도", "5", "로그인 실패 시 차단 임계값", "Y"));
            commonCodeService.saveCode(new CommonCode(null, "SYS_CONFIG", "HEARTBEAT_CYCLE", "에이전트 주기", "30", "C# client 상태보고 주기(초)", "Y"));

            commonCodeService.saveCode(new CommonCode(null, "ROLE_TYPE", "SUPER_ADMIN", "최고 관리자", "A99", "모든 세션 통제 및 설정 변경 가능", "Y"));
            commonCodeService.saveCode(new CommonCode(null, "ROLE_TYPE", "SEC_MANAGER", "보안 관리자", "A50", "감사 로그 관람 및 세션 갱신 가능", "Y"));
            commonCodeService.saveCode(new CommonCode(null, "ROLE_TYPE", "SYSTEM_USER", "모니터링 유저", "U10", "조회 기능만 부여", "Y"));

            commonCodeService.saveCode(new CommonCode(null, "CLIENT_VER", "MIN_ALLOWED_VER", "최소 허용 버전", "1.2.4", "이하 버전 접속 시 갱신 차단", "Y"));
            commonCodeService.saveCode(new CommonCode(null, "CLIENT_VER", "CURR_BUILD_VER", "최신 배포 버전", "1.5.0", "현재 정식 릴리즈 C# 클라이언트", "Y"));
        }

        // 3. Seed Audit Logs
        if (auditLogService.count() == 0) {
            log.info("Seeding sample security audit logs...");
            auditLogService.recordAuditLog(new AuditLog(null, LocalDateTime.now().minusMinutes(5), "malicious_hack", "C# Client: 디버깅 도구 실행 감지", "SECURITY_WARN", "WinAPI CheckRemoteDebuggerPresent=True | x64dbg.exe", "45.138.22.109", "Windows 11 | MAC: 00-50-56-C0-00-08"));
            auditLogService.recordAuditLog(new AuditLog(null, LocalDateTime.now().minusMinutes(10), "manager_kim", "웹 통합 관리자 로그인 승인", "LOGIN", "ID/PW 인증성공 | 세션발급 완료", "211.234.56.90", "MacOS Sonoma | Safari 17.4"));
            auditLogService.recordAuditLog(new AuditLog(null, LocalDateTime.now().minusMinutes(20), "system_cron", "만료 세션 자동 삭제 스케줄러 작동", "SESSION_OP", "Redis EXPIRE 감지 | 2개 세션 제거", "127.0.0.1", "Redis Server Cluster Daemon"));
            auditLogService.recordAuditLog(new AuditLog(null, LocalDateTime.now().minusMinutes(35), "admin", "신규 관리 계정 생성 완료", "CONFIG", "신규 ID: auditor_lee | 권한 등급: SEC_MANAGER", "192.168.10.2", "Windows 11 | Chrome 125.0"));
        }

        // 4. Initialize active sessions in Redis/LocalMap
        if (sessionService.getAllActiveSessions().isEmpty()) {
            log.info("Seeding initial active sessions in Redis...");
            sessionService.saveSession(new SessionDto("sess_f32ea891-b3b4-42f5-b9f1-d0b830ac9a34", "operator_min", "WPF", "192.168.10.15", "B4-2E-99-C1-88-EF", "Windows 10 Pro x64", "WPF Client Embedded", 120, "LOW", "ACTIVE"));
            sessionService.saveSession(new SessionDto("sess_a88190ce-1c4b-4b11-a8bb-e0f39ac8ccb1", "manager_kim", "WEB", "211.234.56.90", "E0-C9-A6-FD-11-22", "MacOS Sonoma v14.4", "Safari 17.4", 120, "MEDIUM", "ACTIVE"));
            sessionService.saveSession(new SessionDto("sess_d78f2441-fa1a-4c28-98e9-d7bc0d88ca12", "malicious_hack", "WPF", "45.138.22.109", "00-50-56-C0-00-08", "Windows 11 Enterprise x64", "x64dbg Debugger Process Attached", 120, "HIGH", "ACTIVE"));
        }

        log.info("Security admin portal initialization complete.");
    }
}
