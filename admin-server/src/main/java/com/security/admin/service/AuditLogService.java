package com.security.admin.service;

import com.security.admin.entity.AuditLog;
import com.security.admin.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFormattedAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        List<Map<String, Object>> response = new ArrayList<>();

        for (AuditLog log : logs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("timestamp", log.getTimestamp() != null ? log.getTimestamp().format(formatter) : "");
            map.put("userId", log.getUserId());
            map.put("action", log.getAction());
            map.put("actionCategory", log.getActionCategory());
            map.put("detail", log.getDetail());
            map.put("ip", log.getIp());
            map.put("pcInfo", log.getPcInfo());
            response.add(map);
        }
        return response;
    }

    @Transactional
    public AuditLog recordAuditLog(AuditLog log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(LocalDateTime.now());
        }
        return auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public long count() {
        return auditLogRepository.count();
    }
}
