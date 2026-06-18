package com.security.admin.scheduler;

import com.security.admin.dto.SessionDto;
import com.security.admin.entity.AuditLog;
import com.security.admin.repository.AuditLogRepository;
import com.security.admin.service.RedisSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class SessionCleanupBatch {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupBatch.class);

    @Autowired
    private RedisSessionService sessionService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // Batch Job: Runs every 1 minute to check for expired Redis/Memory sessions
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredSessionsBatch() {
        log.info("보안 세션 만료 검사 배치(Batch Job) 시작...");
        
        List<SessionDto> activeSessions = sessionService.getAllActiveSessions();
        int expiredCount = 0;

        for (SessionDto session : activeSessions) {
            // If session expired or has <= 0 minutes remaining
            if (session.getExpiresIn() <= 0 || "FORCE_TERMINATED".equals(session.getStatus())) {
                log.info("만료 세션 감지 및 정리 대상: 유저={}, ID={}", session.getUserId(), session.getId());
                
                // 1. Delete session from Redis
                sessionService.deleteSession(session.getId());
                expiredCount++;

                // 2. Write an audit log to PostgreSQL/H2 (감사 로그 기록)
                AuditLog expiredLog = new AuditLog(
                    null,
                    LocalDateTime.now(),
                    session.getUserId(),
                    "배치 차단: 세션 만료 자동 파기",
                    "SESSION_OP",
                    "Redis TTL 만료에 따른 자동 세션 클린업 완료",
                    session.getIp(),
                    session.getOs() + " | " + session.getBrowser()
                );
                auditLogRepository.save(expiredLog);
            }
        }

        if (expiredCount > 0) {
            log.info("배치 작업 완료: 총 {}개의 만료 세션 정리 완료.", expiredCount);
        } else {
            log.info("배치 작업 완료: 정리할 만료 세션 없음.");
        }
    }
}
