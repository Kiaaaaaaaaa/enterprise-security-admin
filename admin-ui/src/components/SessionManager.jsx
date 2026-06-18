import React, { useState } from 'react';

export default function SessionManager({ sessions, onCreateSession, onRenewSession, onForceLogout }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionUser, setNewSessionUser] = useState('');
  const [newSessionIp, setNewSessionIp] = useState('192.168.1.15');
  const [newSessionClientType, setNewSessionClientType] = useState('WPF');
  const [newSessionMac, setNewSessionMac] = useState('B2-C3-E4-91-F3-0A');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSessionUser) return;
    
    onCreateSession({
      userId: newSessionUser,
      ip: newSessionIp,
      clientType: newSessionClientType,
      macAddress: newSessionMac,
      os: newSessionClientType === 'WPF' ? 'Windows 11 x64' : 'MacOS Sonoma (Web)',
      browser: newSessionClientType === 'WPF' ? 'WPF Client Embedded' : 'Chrome 125',
      riskLevel: 'LOW'
    });

    // Reset form
    setNewSessionUser('');
    setNewSessionIp('192.168.1.15');
    setNewSessionMac('B2-C3-E4-91-F3-0A');
    setShowCreateModal(false);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Redis 세션 관리 (Session CRUD)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            서버 메모리(Redis) 상의 액티브 세션 리스트 조회, 세션 강제 종료 및 주기 연장 기능
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ 신규 세션 임의 발행 (Create)
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>세션 ID (UUID)</th>
                <th>대상 유저</th>
                <th>클라이언트 형태</th>
                <th>접속 IP</th>
                <th>맥 어드레스 (MAC)</th>
                <th>남은 시간</th>
                <th>위험 수준</th>
                <th>상태</th>
                <th style={{ textAlign: 'center' }}>조치</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    활성화된 Redis 세션이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {session.id.substring(0, 18)}...
                    </td>
                    <td style={{ fontWeight: '600' }}>{session.userId}</td>
                    <td>
                      <span className={`badge ${session.clientType === 'WPF' ? 'badge-info' : 'badge-success'}`}>
                        {session.clientType === 'WPF' ? '💻 C# WPF App' : '🌐 Web Browser'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{session.ip}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {session.macAddress}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: session.expiresIn < 15 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                      {session.expiresIn} 분
                    </td>
                    <td>
                      <span className={`badge ${session.riskLevel === 'HIGH' ? 'badge-danger' : (session.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success')}`}>
                        {session.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className={`pulse-indicator ${session.status === 'ACTIVE' ? 'pulse-green' : 'pulse-red'}`} />
                        <span style={{ fontSize: '0.8rem' }}>{session.status}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onRenewSession(session.id)}
                          disabled={session.status !== 'ACTIVE'}
                        >
                          🔄 갱신 (Renew)
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onForceLogout(session.id)}
                          disabled={session.status !== 'ACTIVE'}
                        >
                          🚫 강제로그아웃
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual session creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">
              <h3>Redis 임의 세션 발급</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">대상 사용자 ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: user_test"
                  value={newSessionUser}
                  onChange={(e) => setNewSessionUser(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">클라이언트 플랫폼</label>
                <select
                  className="form-control"
                  value={newSessionClientType}
                  onChange={(e) => setNewSessionClientType(e.target.value)}
                >
                  <option value="WPF">C# WPF Client</option>
                  <option value="WEB">Web Browser</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">발생 IP 주소</label>
                <input
                  type="text"
                  className="form-control"
                  value={newSessionIp}
                  onChange={(e) => setNewSessionIp(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">클라이언트 맥 주소 (MAC)</label>
                <input
                  type="text"
                  className="form-control"
                  value={newSessionMac}
                  onChange={(e) => setNewSessionMac(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">발급 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
