package com.security.admin.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class ErrorResponse {
    private int status;
    private String errorCode;
    private String message;
    private Map<String, String> validationErrors;
    private LocalDateTime timestamp;
}
