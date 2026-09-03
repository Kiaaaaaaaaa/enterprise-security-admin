package com.security.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;

    @NotBlank(message = "사용자 ID(userId)는 필수 입력값입니다.")
    private String userId;

    @NotBlank(message = "클라이언트 유형(clientType)은 필수 입력값입니다.")
    private String clientType; // WPF, WEB

    @NotBlank(message = "IP 주소는 필수 입력값입니다.")
    @Pattern(
        regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        message = "올바른 IPv4 주소 형식(예: 192.168.1.1)이어야 합니다."
    )
    private String ip;

    @Pattern(
        regexp = "^$|^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
        message = "올바른 MAC 주소 형식(예: 00:50:56:C0:00:08 또는 00-50-56-C0-00-08)이어야 합니다."
    )
    private String macAddress;

    private String os;
    private String browser;

    @Min(value = 0, message = "세션 잔여 시간은 0분 이상이어야 합니다.")
    private long expiresIn; // remaining minutes

    private String riskLevel; // LOW, MEDIUM, HIGH
    private String status; // ACTIVE, FORCE_TERMINATED, EXPIRED
}
