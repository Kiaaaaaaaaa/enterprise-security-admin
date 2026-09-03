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
    @DisplayName("세션 강제 종료 API (204 No Content)")
    void testDeleteSession() throws Exception {
        mockMvc.perform(delete("/api/admin/sessions/sess_001"))
                .andExpect(status().isNoContent());
    }
}
