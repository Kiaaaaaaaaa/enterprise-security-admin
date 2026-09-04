import React, { useState, useEffect } from 'react';

export default function Dashboard({ sessions = [], auditLogs = [], users = [], codes = [], systemMetrics = null, clientInfo = null }) {
  // Dynamic Risk Analysis Tool state (initialized with real client data)
  const [testIp, setTestIp] = useState(clientInfo?.ip || '127.0.0.1');
  const [testOs, setTestOs] = useState(clientInfo?.os || 'Windows PC');
  const [testMac, setTestMac] = useState('00:50:56:C0:00:08');
  const [hasDebugger, setHasDebugger] = useState(false);
  const [isVm, setIsVm] = useState(false);
  const [calculatedRisk, setCalculatedRisk] = useState(null);

  useEffect(() => {
    if (clientInfo) {
      if (clientInfo.ip && testIp === '127.0.0.1') setTestIp(clientInfo.ip);
      if (clientInfo.os && testOs === 'Windows PC') setTestOs(clientInfo.os);
    }
  }, [clientInfo]);

  // Dynamic metrics from actual DB state
  const totalSessions = sessions.length;
  const activeSessionsCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const highRiskSessionsCount = sessions.filter(s => s.riskLevel === 'HIGH').length;
  const wpfCount = sessions.filter(s => s.clientType === 'WPF').length;

  // Dynamic Average TTL
  const avgExpiry = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.expiresIn || 0), 0) / sessions.length)
    : Number(codes.find(c => c.code === 'SESSION_EXPIRY')?.val || 120);

  const runRiskAnalysis = () => {
    let score = 0;
    let factors = [];

    // Analyze IP
    if (testIp.startsWith('10.') || testIp.startsWith('192.168.') || testIp === '127.0.0.1') {
      factors.push("사내/로컬 신뢰 IP 대역 (" + testIp + ")");
    } else {
      score += 20;
      factors.push("외부 공인 IP 접근 (공용 인터넷 망: " + testIp + ")");
    }

    // Analyze MAC
    if (testMac.startsWith('00-50-56') || testMac.startsWith('00:50:56') || testMac.startsWith('00:0C:29')) {
      score += 30;
      factors.push("VMware/VirtualBox 가상 MAC 어드레스 검출 (" + testMac + ")");
      setIsVm(true);
    }

    if (isVm) {
      score += 20;
      factors.push("가상 머신 실행 차단 보안 규칙 가동");
    }

    // Analyze Debugger
    if (hasDebugger) {
      score += 50;
      factors.push("C# Client: User-mode 디버거 탐지 (WinDbg/x64dbg)");
    }

    let level = "LOW";
    if (score >= 60) level = "HIGH";
    else if (score >= 30) level = "MEDIUM";

    setCalculatedRisk({
      score,
      level,
      factors: factors.length > 0 ? factors : ["탐지된 특이사항 없음 (정상 단말기)"]
    });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>시스템 현황판</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Redis 세션 클러스터 및 PostgreSQL 연동 실시간 통계 모니터링
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
            <span className="pulse-indicator pulse-green" style={{ marginRight: '0.5rem' }} />
            Redis 세션: {activeSessionsCount}개 활성
          </span>
          <span className="badge badge-info" style={{ padding: '0.5rem 1rem' }}>
            PostgreSQL: {auditLogs.length}건 감사로그
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ color: 'var(--accent-teal)', backgroundColor: 'rgba(20, 184, 166, 0.1)' }}>
            ⚡
          </div>
          <div className="metric-info">
            <h4>실시간 활성 세션</h4>
            <p>{activeSessionsCount} / {totalSessions}</p>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ color: 'var(--accent-red)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            ⚠️
          </div>
          <div className="metric-info">
            <h4>위험 감지 세션</h4>
            <p style={{ color: highRiskSessionsCount > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
              {highRiskSessionsCount} 건
            </p>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ color: 'var(--accent-purple)', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            💻
          </div>
          <div className="metric-info">
            <h4>C# WPF 에이전트</h4>
            <p>{wpfCount} 대</p>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ color: 'var(--accent-amber)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            ⏳
          </div>
          <div className="metric-info">
            <h4>평균 세션 잔여주기</h4>
            <p>{avgExpiry} 분</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* PC Info & Risk Factor Simulation Tool */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔍 PC Info & Risk Factor 보안 평점 진단기
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            클라이언트로부터 전송받은 실제 단말기 환경 정보 및 IP 대역을 기반으로 위협 수준을 실시간 계산하는 엔진입니다.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">요청 IP 주소 (감지된 IP)</label>
              <input
                type="text"
                className="form-control"
                value={testIp}
                onChange={(e) => setTestIp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PC 운영체제 (OS Info)</label>
              <input
                type="text"
                className="form-control"
                value={testOs}
                onChange={(e) => setTestOs(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">물리 MAC 주소 (Hardware MAC)</label>
              <input
                type="text"
                className="form-control"
                value={testMac}
                onChange={(e) => setTestMac(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={hasDebugger}
                  onChange={(e) => setHasDebugger(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                디버거 실행 감지 (WinAPI)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={isVm}
                  onChange={(e) => setIsVm(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                VMware/VirtualBox 여부
              </label>
            </div>
          </div>

          <button onClick={runRiskAnalysis} className="btn btn-primary" style={{ width: '100%' }}>
            위험 지수 평가 실행 (Evaluate Risk)
          </button>

          {calculatedRisk && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: '8px',
              backgroundColor: calculatedRisk.level === 'HIGH' ? 'rgba(239, 68, 68, 0.08)' : (calculatedRisk.level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(20, 184, 166, 0.08)'),
              border: `1px solid ${calculatedRisk.level === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : (calculatedRisk.level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(20, 184, 166, 0.2)')}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  위험 스코어: 
                  <span style={{
                    color: calculatedRisk.level === 'HIGH' ? 'var(--accent-red)' : (calculatedRisk.level === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--accent-teal)'),
                    fontWeight: '800',
                    fontSize: '1.25rem'
                  }}>
                    {calculatedRisk.score}점
                  </span>
                </h4>
                <span className={`badge ${calculatedRisk.level === 'HIGH' ? 'badge-danger' : (calculatedRisk.level === 'MEDIUM' ? 'badge-warning' : 'badge-success')}`}>
                  위험수준: {calculatedRisk.level}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>매칭된 보안 규칙 요약:</div>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {calculatedRisk.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Real Dynamic System Infrastructures Status */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>⚙️ 실시간 인프라 메트릭</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Redis Status */}
            <div style={{ padding: '0.875rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>SESSION STORE (REDIS)</span>
                <span style={{ color: 'var(--accent-teal)' }}>ACTIVE</span>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
                {systemMetrics?.redisStatus || "CONNECTED (Redis Cache)"}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                SCAN Cursor 활성 세션: {sessions.length}건 실시간 적재
              </div>
            </div>

            {/* PostgreSQL / JPA Status */}
            <div style={{ padding: '0.875rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>PERSISTENCE DB (JPA)</span>
                <span style={{ color: 'var(--accent-teal)' }}>ONLINE</span>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
                {systemMetrics?.dbStatus || "ONLINE (HikariCP PostgreSQL)"}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                감사로그: {auditLogs.length}건 | 계정: {users.length}명 | 공통코드: {codes.length}개
              </div>
            </div>

            {/* JVM Memory Runtime */}
            <div style={{ padding: '0.875rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>JVM RUNTIME & HOSTING</span>
                <span style={{ color: 'var(--accent-blue)' }}>RENDER CLOUD</span>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
                JVM 힙: {systemMetrics ? `${systemMetrics.jvmMemoryUsedMb}MB / ${systemMetrics.jvmMemoryTotalMb}MB` : "동적 메모리 측정 중"}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                서버 가동 시간: {systemMetrics ? `${Math.floor(systemMetrics.uptimeSeconds / 60)}분 ${systemMetrics.uptimeSeconds % 60}초` : "Active"}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Recent Activity Log Preview */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📋 최근 보안 감사 로그 (PostgreSQL 실시간 동기화)</h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>대상 계정</th>
                <th>보안 이벤트</th>
                <th>발생 IP</th>
                <th>디바이스 정보</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    기록된 감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                    <td style={{ fontWeight: '600' }}>{log.userId}</td>
                    <td>
                      <span className={`badge ${log.action?.includes('차단') || log.action?.includes('실패') || log.actionCategory === 'SECURITY_WARN' ? 'badge-danger' : (log.action?.includes('갱신') ? 'badge-info' : 'badge-success')}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.ip}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.pcInfo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
