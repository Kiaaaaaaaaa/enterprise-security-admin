package com.security.admin.scheduler;

import com.security.admin.dto.SessionDto;
import com.security.admin.entity.AuditLog;
import com.security.admin.service.AuditLogService;
import com.security.admin.service.RedisSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionCleanupBatchTest {

    @Mock
    private RedisSessionService sessionService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private SessionCleanupBatch sessionCleanupBatch;

    @Test
    @DisplayName("배치 스케줄러: 만료된 세션 자동 감지 및 삭제 & 감사로그 기록 테스트")
    void testCleanupExpiredSessionsBatch() {
        // Given
        SessionDto expiredSession = new SessionDto(
                "sess_expired",
                "hacker_user",
                "WPF",
                "10.0.0.1",
                "00:50:56:C0:00:08",
                "Windows 10",
                "x64dbg",
                0, // 0분 남음 -> 만료 대상
                "HIGH",
                "EXPIRED"
        );

        SessionDto activeSession = new SessionDto(
                "sess_active",
                "normal_user",
                "WEB",
                "192.168.1.10",
                "00:50:56:C0:00:08",
                "macOS",
                "Safari",
                90,
                "LOW",
                "ACTIVE"
        );

        given(sessionService.getAllActiveSessions()).willReturn(List.of(expiredSession, activeSession));

        // When
        sessionCleanupBatch.cleanupExpiredSessionsBatch();

        // Then
        // 1. 만료된 세션은 삭제 호출되어야 함
        verify(sessionService, times(1)).deleteSession("sess_expired");
        // 2. 정상 활성 세션은 삭제 호출되면 안 됨
        verify(sessionService, never()).deleteSession("sess_active");
        // 3. 감사 로그에 1건 기록되어야 함
        verify(auditLogService, times(1)).recordAuditLog(any(AuditLog.class));
    }
}
