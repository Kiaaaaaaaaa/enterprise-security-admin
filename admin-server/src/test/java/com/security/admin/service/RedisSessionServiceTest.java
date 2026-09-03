package com.security.admin.service;

import com.security.admin.dto.SessionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class RedisSessionServiceTest {

    @InjectMocks
    private RedisSessionService sessionService;

    private SessionDto testSession;

    @BeforeEach
    void setUp() {
        testSession = new SessionDto(
                "sess_test_123",
                "operator_test",
                "WPF",
                "192.168.1.100",
                "00:50:56:C0:00:08",
                "Windows 11",
                "WPF Client",
                120,
                "LOW",
                "ACTIVE"
        );
    }

    @Test
    @DisplayName("로컬 폴백 저장소에 세션 저장 및 조회 테스트 (Fallback Test)")
    void testSaveAndGetSessionFallback() {
        // Given
        sessionService.saveSession(testSession);

        // When
        List<SessionDto> sessions = sessionService.getAllActiveSessions();

        // Then
        assertThat(sessions).isNotEmpty();
        assertThat(sessions).anyMatch(s -> s.getId().equals("sess_test_123") && s.getUserId().equals("operator_test"));
    }

    @Test
    @DisplayName("세션 TTL 갱신(Renew) 테스트")
    void testRenewSessionTtlFallback() {
        // Given
        testSession.setExpiresIn(10);
        sessionService.saveSession(testSession);

        // When
        sessionService.renewSessionTtl("sess_test_123");
        List<SessionDto> sessions = sessionService.getAllActiveSessions();

        // Then
        SessionDto renewed = sessions.stream()
                .filter(s -> s.getId().equals("sess_test_123"))
                .findFirst()
                .orElse(null);

        assertThat(renewed).isNotNull();
        assertThat(renewed.getExpiresIn()).isEqualTo(120);
    }

    @Test
    @DisplayName("세션 강제 종료(Delete) 테스트")
    void testDeleteSessionFallback() {
        // Given
        sessionService.saveSession(testSession);

        // When
        sessionService.deleteSession("sess_test_123");
        List<SessionDto> sessions = sessionService.getAllActiveSessions();

        // Then
        assertThat(sessions).noneMatch(s -> s.getId().equals("sess_test_123"));
    }
}
