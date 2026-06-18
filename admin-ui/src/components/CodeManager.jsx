import React, { useState } from 'react';

export default function CodeManager() {
  // Mock Common Code DB
  const [groupCodes, setGroupCodes] = useState([
    { code: 'SYS_CONFIG', name: '시스템 공통 설정', desc: '세션 만료 및 스로틀링 설정 그룹' },
    { code: 'ROLE_TYPE', name: '사용자 등급 설정', desc: '시스템 관리 계정 권한 등급 종류' },
    { code: 'CLIENT_VER', name: 'C# 클라이언트 버전', desc: 'WPF 강제 업데이트 차단 버전 코드' },
    { code: 'RISK_LVL', name: '위험성 스코어 레벨', desc: 'IP/MAC 이상 감지 스코어 등급' }
  ]);

  const [detailCodes, setDetailCodes] = useState({
    'SYS_CONFIG': [
      { code: 'SESSION_EXPIRY', name: '세션 만료 기한', val: '120', desc: '활성 세션 주기 제한 시간(분)', useYn: 'Y' },
      { code: 'MAX_RETRY_LOGIN', name: '최대 로그인 시도', val: '5', desc: '로그인 실패 시 차단 임계값', useYn: 'Y' },
      { code: 'HEARTBEAT_CYCLE', name: '에이전트 주기', val: '30', desc: 'C# client 상태보고 주기(초)', useYn: 'Y' }
    ],
    'ROLE_TYPE': [
      { code: 'SUPER_ADMIN', name: '최고 관리자', val: 'A99', desc: '모든 세션 통제 및 설정 변경 가능', useYn: 'Y' },
      { code: 'SEC_MANAGER', name: '보안 관리자', val: 'A50', desc: '감사 로그 관람 및 세션 갱신 가능', useYn: 'Y' },
      { code: 'SYSTEM_USER', name: '모니터링 유저', val: 'U10', desc: '조회 기능만 부여', useYn: 'Y' }
    ],
    'CLIENT_VER': [
      { code: 'MIN_ALLOWED_VER', name: '최소 허용 버전', val: '1.2.4', desc: '이하 버전 접속 시 갱신 차단', useYn: 'Y' },
      { code: 'CURR_BUILD_VER', name: '최신 배포 버전', val: '1.5.0', desc: '현재 정식 릴리즈 C# 클라이언트', useYn: 'Y' }
    ],
    'RISK_LVL': [
      { code: 'LVL_LOW', name: '낮은 위험도', val: '15', desc: '외부망 접근 등 마이너 위협 스코어', useYn: 'Y' },
      { code: 'LVL_MED', name: '중간 위험도', val: '35', desc: '가상 머신 실행 등 주요 위협', useYn: 'Y' },
      { code: 'LVL_HIGH', name: '높은 위험도', val: '65', desc: '디버거 실행 등 직접적인 크랙 위협', useYn: 'Y' }
    ]
  });

  const [selectedGroupCode, setSelectedGroupCode] = useState('SYS_CONFIG');

  // Input states
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [newDetailCode, setNewDetailCode] = useState('');
  const [newDetailName, setNewDetailName] = useState('');
  const [newDetailVal, setNewDetailVal] = useState('');

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!newGroupCode || !newGroupName) return;

    if (groupCodes.some(g => g.code === newGroupCode)) {
      alert("이미 존재하는 그룹코드입니다.");
      return;
    }

    const newGroup = { code: newGroupCode.toUpperCase(), name: newGroupName, desc: newGroupDesc };
    setGroupCodes([...groupCodes, newGroup]);
    setDetailCodes({
      ...detailCodes,
      [newGroup.code]: []
    });

    setNewGroupCode('');
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleAddDetail = (e) => {
    e.preventDefault();
    if (!newDetailCode || !newDetailName) return;

    const list = detailCodes[selectedGroupCode] || [];
    if (list.some(d => d.code === newDetailCode)) {
      alert("이미 존재하는 상세코드입니다.");
      return;
    }

    const newDetail = {
      code: newDetailCode.toUpperCase(),
      name: newDetailName,
      val: newDetailVal,
      desc: '',
      useYn: 'Y'
    };

    setDetailCodes({
      ...detailCodes,
      [selectedGroupCode]: [...list, newDetail]
    });

    setNewDetailCode('');
    setNewDetailName('');
    setNewDetailVal('');
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>공통 코드 관리 (Code Management)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          JPA 백엔드 및 Redis, C# 클라이언트 에이전트와 통신하는 동적 시스템 설정 코드 데이터베이스
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Group Code Table */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📦 그룹 코드 리스트</h3>
            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>신규 그룹 추가</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="그룹 코드 (영문대문자)"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="그룹명"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }}>그룹 생성</button>
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
                    <th>사용여부</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailCodes[selectedGroupCode] || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        등록된 세부 코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    (detailCodes[selectedGroupCode] || []).map((d) => (
                      <tr key={d.code}>
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
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>신규 코드 값 추가</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.5fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="코드명"
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
                  placeholder="설정값"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  value={newDetailVal}
                  onChange={(e) => setNewDetailVal(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>추가</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
