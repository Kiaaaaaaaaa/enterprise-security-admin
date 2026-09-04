import React, { useState, useMemo } from 'react';
import { createCodeApi } from '../services/api';

export default function CodeManager({ codes = [], onRefreshCodes }) {
  const [selectedGroupCode, setSelectedGroupCode] = useState('SYS_CONFIG');

  // Input states
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [newDetailCode, setNewDetailCode] = useState('');
  const [newDetailName, setNewDetailName] = useState('');
  const [newDetailVal, setNewDetailVal] = useState('');
  const [newDetailDesc, setNewDetailDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group dynamic codes from PostgreSQL by groupCode
  const groupCodes = useMemo(() => {
    const map = new Map();
    codes.forEach(c => {
      const gCode = c.groupCode || 'SYS_CONFIG';
      if (!map.has(gCode)) {
        let defaultDesc = '시스템 공통 설정 그룹';
        let defaultName = gCode;
        if (gCode === 'SYS_CONFIG') { defaultName = '시스템 공통 설정'; defaultDesc = '세션 만료 및 스로틀링 설정 그룹'; }
        else if (gCode === 'ROLE_TYPE') { defaultName = '사용자 등급 설정'; defaultDesc = '시스템 관리 계정 권한 등급 종류'; }
        else if (gCode === 'CLIENT_VER') { defaultName = 'C# 클라이언트 버전'; defaultDesc = 'WPF 강제 업데이트 차단 버전 코드'; }
        else if (gCode === 'RISK_LVL') { defaultName = '위험성 스코어 레벨'; defaultDesc = 'IP/MAC 이상 감지 스코어 등급'; }
        
        map.set(gCode, { code: gCode, name: defaultName, desc: defaultDesc });
      }
    });
    return Array.from(map.values());
  }, [codes]);

  // Selected Group's detail codes from PostgreSQL
  const detailCodes = useMemo(() => {
    return codes.filter(c => c.groupCode === selectedGroupCode);
  }, [codes, selectedGroupCode]);

  // If selectedGroupCode is not in groupCodes, default to first available
  React.useEffect(() => {
    if (groupCodes.length > 0 && !groupCodes.some(g => g.code === selectedGroupCode)) {
      setSelectedGroupCode(groupCodes[0].code);
    }
  }, [groupCodes, selectedGroupCode]);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupCode || !newGroupName) return;

    const gCodeUpper = newGroupCode.toUpperCase().trim();
    if (groupCodes.some(g => g.code === gCodeUpper)) {
      alert("이미 존재하는 그룹코드입니다.");
      return;
    }

    setIsSubmitting(true);
    // Create first code item in this group in PostgreSQL
    const newCodeEntity = {
      groupCode: gCodeUpper,
      code: "INIT_CONFIG",
      name: newGroupName,
      val: "1",
      desc: newGroupDesc || `${newGroupName} 초기 설정값`,
      useYn: "Y"
    };

    const success = await createCodeApi(newCodeEntity);
    setIsSubmitting(false);

    if (success) {
      setSelectedGroupCode(gCodeUpper);
      setNewGroupCode('');
      setNewGroupName('');
      setNewGroupDesc('');
      if (onRefreshCodes) onRefreshCodes();
    } else {
      alert("공통 코드 생성에 실패했습니다.");
    }
  };

  const handleAddDetail = async (e) => {
    e.preventDefault();
    if (!newDetailCode || !newDetailName) return;

    const dCodeUpper = newDetailCode.toUpperCase().trim();
    if (detailCodes.some(d => d.code === dCodeUpper)) {
      alert("이미 존재하는 상세코드입니다.");
      return;
    }

    setIsSubmitting(true);
    const newDetailEntity = {
      groupCode: selectedGroupCode,
      code: dCodeUpper,
      name: newDetailName,
      val: newDetailVal || "0",
      desc: newDetailDesc,
      useYn: "Y"
    };

    const success = await createCodeApi(newDetailEntity);
    setIsSubmitting(false);

    if (success) {
      setNewDetailCode('');
      setNewDetailName('');
      setNewDetailVal('');
      setNewDetailDesc('');
      if (onRefreshCodes) onRefreshCodes();
    } else {
      alert("상세 코드 생성에 실패했습니다.");
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>공통 코드 관리 (Code Management)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            PostgreSQL <code style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>common_codes</code> 테이블과 실시간 동기화되는 동적 시스템 설정
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onRefreshCodes} style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}>
          🔄 DB 최신화
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Group Code Table */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📦 그룹 코드 리스트 ({groupCodes.length}개)</h3>
            <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>그룹코드</th>
                    <th>그룹이름</th>
                  </tr>
                </thead>
                <tbody>
                  {groupCodes.map((g) => (
                    <tr
                      key={g.code}
                      onClick={() => setSelectedGroupCode(g.code)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedGroupCode === g.code ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                        borderLeft: selectedGroupCode === g.code ? '3px solid var(--accent-blue)' : 'none'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{g.code}</td>
                      <td>{g.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Group Code Form */}
            <form onSubmit={handleAddGroup} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>신규 그룹 추가 (PostgreSQL 영구 저장)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="그룹 코드 (영문대문자, 예: AUTH_CONFIG)"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="그룹명 (예: 인증 보안 정책)"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : '그룹 생성 (DB 반영)'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Detail Code Table */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>
                🔑 상세 코드 목록: <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{selectedGroupCode}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {groupCodes.find(g => g.code === selectedGroupCode)?.desc}
              </span>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>상세코드</th>
                    <th>코드명</th>
                    <th>설정값 (Value)</th>
                    <th>설명</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {detailCodes.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        등록된 세부 코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    detailCodes.map((d) => (
                      <tr key={d.id || d.code}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{d.code}</td>
                        <td>{d.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>{d.val}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.desc || '-'}</td>
                        <td>
                          <span className={`badge ${d.useYn === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                            {d.useYn}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Detail Code Form */}
            <form onSubmit={handleAddDetail} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>신규 코드 값 추가 (PostgreSQL)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.5fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="코드 ID (예: TOKEN_TTL)"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newDetailCode}
                  onChange={(e) => setNewDetailCode(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="코드 한글명"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newDetailName}
                  onChange={(e) => setNewDetailName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="설정값 (Value)"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newDetailVal}
                  onChange={(e) => setNewDetailVal(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? '저장...' : '추가'}
                </button>
              </div>
              <input
                type="text"
                placeholder="코드 설명 (선택사항)"
                className="form-control"
                style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                value={newDetailDesc}
                onChange={(e) => setNewDetailDesc(e.target.value)}
              />
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
