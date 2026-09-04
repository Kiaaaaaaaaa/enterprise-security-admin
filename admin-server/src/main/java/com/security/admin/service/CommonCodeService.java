package com.security.admin.service;

import com.security.admin.entity.CommonCode;
import com.security.admin.repository.CommonCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommonCodeService {

    private final CommonCodeRepository commonCodeRepository;

    @Autowired
    public CommonCodeService(CommonCodeRepository commonCodeRepository) {
        this.commonCodeRepository = commonCodeRepository;
    }

    @Transactional(readOnly = true)
    public List<CommonCode> getAllCodes() {
        return commonCodeRepository.findAll();
    }

    @Transactional
    public CommonCode saveCode(CommonCode code) {
        if (code.getGroupCode() == null || code.getGroupCode().trim().isEmpty()) {
            throw new IllegalArgumentException("그룹 코드는 필수입니다.");
        }
        if (code.getCode() == null || code.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("코드는 필수입니다.");
        }
        return commonCodeRepository.save(code);
    }

    @Transactional(readOnly = true)
    public String findValueByGroupAndCode(String groupCode, String code, String defaultValue) {
        return commonCodeRepository.findAll().stream()
                .filter(c -> groupCode.equalsIgnoreCase(c.getGroupCode()) && code.equalsIgnoreCase(c.getCode()))
                .map(CommonCode::getVal)
                .findFirst()
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public long count() {
        return commonCodeRepository.count();
    }
}
