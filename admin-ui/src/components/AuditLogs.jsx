import React, { useState } from 'react';

export default function AuditLogs({ auditLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.ip.includes(searchTerm) || 
                          log.pcInfo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.actionCategory === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>보안 감사 로그 (Audit Logs)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          사용자 로그인, C# WPF 에이전트 정보 획득, 세션 갱신 및 강제 로그아웃 등의 전수 기록 조회
        </p>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem' }}>검색어 (ID, IP, 디바이스)</label>
            <input
              type="text"
              className="form-control"
              placeholder="검색어를 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem' }}>로그 구분 필터</label>
            <select
              className="form-control"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">전체 보기</option>
              <option value="LOGIN">로그인 / 인증</option>
              <option value="SESSION_OP">세션 갱신/만료</option>
              <option value="FORCE_LOGOUT">강제 로그아웃</option>
              <option value="SECURITY_WARN">보안 위험 감지</option>
              <option value="CONFIG">설정 변경</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>기록 일시</th>
                <th style={{ width: '120px' }}>로그 구분</th>
                <th>대상 계정</th>
                <th>상세 행위</th>
                <th>발생 IP 주소</th>
                <th>디바이스 정보</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    조건에 부합하는 감사 로그가 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let badgeClass = 'badge-info';
                  if (log.actionCategory === 'SECURITY_WARN') badgeClass = 'badge-danger';
                  if (log.actionCategory === 'FORCE_LOGOUT') badgeClass = 'badge-warning';
                  if (log.actionCategory === 'LOGIN') badgeClass = 'badge-success';

                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {log.actionCategory}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{log.userId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{log.action}</span>
                          {log.detail && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>
                              {log.detail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{log.ip}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.pcInfo}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
