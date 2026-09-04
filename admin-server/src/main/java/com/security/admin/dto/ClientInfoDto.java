package com.security.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientInfoDto {
    private String ip;
    private String userAgent;
    private String os;
    private String browser;
    private String serverTime;
    private boolean isLocal;
}
