package com.security.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.security.admin.dto.SessionDto;
import com.security.admin.service.AdminUserService;
import com.security.admin.service.AuditLogService;
import com.security.admin.service.CommonCodeService;
import com.security.admin.service.RedisSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminApiController.class)
class AdminApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RedisSessionService sessionService;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private CommonCodeService commonCodeService;

    @Test
    @DisplayName("서버 헬스체크 API 테스트")
    void testHealthCheck() throws Exception {
        given(sessionService.isRedisAvailable()).willReturn(true);

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.redis").value("CONNECTED"))
                .andExpect(jsonPath("$.db").value("CONNECTED"));
    }

    @Test
    @DisplayName("활성 세션 목록 조회 API 테스트")
    void testGetSessions() throws Exception {
        SessionDto session = new SessionDto(
                "sess_001",
                "admin",
                "WEB",
                "127.0.0.1",
                "00:50:56:C0:00:08",
                "macOS",
                "Safari",
                120,
                "LOW",
                "ACTIVE"
        );
        given(sessionService.getAllActiveSessions()).willReturn(List.of(session));

        mockMvc.perform(get("/api/admin/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("sess_001"))
                .andExpect(jsonPath("$[0].userId").value("admin"));
    }

    @Test
    @DisplayName("세션 생성 API - 정상 데이터 등록 (201 Created)")
    void testCreateSessionSuccess() throws Exception {
        SessionDto validSession = new SessionDto(
                "sess_002",
                "operator_kim",
                "WPF",
                "192.168.10.25",
                "00:50:56:C0:00:08",
                "Windows 11",
                "WPF Client",
                120,
                "LOW",
                "ACTIVE"
        );

        mockMvc.perform(post("/api/admin/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSession)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("세션 생성 API - 잘못된 IP 포맷 검증 실패 (400 Bad Request)")
    void testCreateSessionValidationFailure() throws Exception {
        SessionDto invalidSession = new SessionDto(
                "sess_invalid",
                "operator_kim",
                "WPF",
                "999.999.999.999", // 잘못된 IP 주소
                "00:50:56:C0:00:08",
                "Windows 11",
                "WPF Client",
                120,
                "LOW",
                "ACTIVE"
        );

        mockMvc.perform(post("/api/admin/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidSession)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_INPUT_ARGUMENTS"))
                .andExpect(jsonPath("$.validationErrors.ip").exists());
    }

    @Test
    @DisplayName("시스템 실시간 메트릭 API 테스트")
    void testGetSystemMetrics() throws Exception {
        given(sessionService.isRedisAvailable()).willReturn(true);
        given(sessionService.getAllActiveSessions()).willReturn(Collections.emptyList());
        given(auditLogService.count()).willReturn(10L);
        given(adminUserService.count()).willReturn(3L);
        given(commonCodeService.count()).willReturn(8L);

        mockMvc.perform(get("/api/admin/system/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redisStatus").value("CONNECTED (Active Master)"))
                .andExpect(jsonPath("$.totalAuditLogsCount").value(10))
                .andExpect(jsonPath("$.totalUsersCount").value(3))
                .andExpect(jsonPath("$.totalCodesCount").value(8));
    }

    @Test
    @DisplayName("동적 클라이언트 정보 진단 API 테스트")
    void testGetClientInfo() throws Exception {
        mockMvc.perform(get("/api/admin/client-info")
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0 Safari/537.36")
                        .header("X-Forwarded-For", "203.0.113.195"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ip").value("203.0.113.195"))
                .andExpect(jsonPath("$.os").value("Windows PC"))
                .andExpect(jsonPath("$.browser").value("Google Chrome"));
    }

    @Test
    @DisplayName("세션 강제 종료 API (204 No Content)")
    void testDeleteSession() throws Exception {
        mockMvc.perform(delete("/api/admin/sessions/sess_001"))
                .andExpect(status().isNoContent());
    }
}
