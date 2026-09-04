package com.security.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetricsDto {
    private long jvmMemoryUsedMb;
    private long jvmMemoryTotalMb;
    private long jvmMemoryMaxMb;
    private int activeSessionsCount;
    private long totalAuditLogsCount;
    private long totalUsersCount;
    private long totalCodesCount;
    private String redisStatus;
    private String dbStatus;
    private long uptimeSeconds;
}
