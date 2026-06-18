package com.security.admin.dto;

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
    private String userId;
    private String clientType; // WPF, WEB
    private String ip;
    private String macAddress;
    private String os;
    private String browser;
    private long expiresIn; // remaining minutes
    private String riskLevel; // LOW, MEDIUM, HIGH
    private String status; // ACTIVE, FORCE_TERMINATED, EXPIRED
}
