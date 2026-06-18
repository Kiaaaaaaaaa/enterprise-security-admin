package com.security.admin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "common_codes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"groupCode", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommonCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String groupCode; // e.g. SYS_CONFIG, ROLE_TYPE

    @Column(nullable = false)
    private String code;      // e.g. SESSION_EXPIRY, SUPER_ADMIN

    @Column(nullable = false)
    private String name;      // e.g. 세션 만료 기한, 최고 관리자

    @Column(nullable = false)
    private String val;       // e.g. 120, A99

    @Column(name = "description")
    private String desc;

    @Column(nullable = false, length = 1)
    private String useYn = "Y";
}
