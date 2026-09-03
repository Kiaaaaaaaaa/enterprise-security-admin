package com.security.admin.service;

import com.security.admin.entity.AdminUser;
import com.security.admin.repository.AdminUserRepository;
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
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Autowired
    public AdminUserService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsersFormatted() {
        List<AdminUser> users = adminUserRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (AdminUser user : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("role", user.getRole());
            map.put("dept", user.getDept());
            map.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "");
            response.add(map);
        }
        return response;
    }

    @Transactional
    public AdminUser createUser(AdminUser user) {
        if (user.getId() == null || user.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다.");
        }
        if (adminUserRepository.existsById(user.getId())) {
            throw new IllegalArgumentException("이미 존재하는 사용자 ID입니다: " + user.getId());
        }
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        return adminUserRepository.save(user);
    }

    @Transactional(readOnly = true)
    public long count() {
        return adminUserRepository.count();
    }
}
