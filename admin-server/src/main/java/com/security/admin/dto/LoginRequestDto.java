package com.security.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {

    @NotBlank(message = "관리자 계정 ID는 필수입니다.")
    private String username;

    private String password;

    private String ip;
    private String os;
    private String browser;
    private String macAddress;
}
