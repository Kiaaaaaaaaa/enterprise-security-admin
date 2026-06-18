package com.security.admin.repository;

import com.security.admin.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, Long> {
    List<CommonCode> findAllByGroupCode(String groupCode);
}
