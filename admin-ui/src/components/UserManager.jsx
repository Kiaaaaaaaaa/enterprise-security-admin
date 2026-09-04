import React, { useState } from 'react';

export default function UserManager({ users = [], onCreateUser }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('SEC_MANAGER');
  const [newUserDept, setNewUserDept] = useState('보안운영팀');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUserId || !newUserName) return;

    const trimmedId = newUserId.trim();
    if (users.some(u => u.id === trimmedId)) {
      setErrorMessage("이미 등록되어 있는 계정 ID입니다: " + trimmedId);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await onCreateUser({
      id: trimmedId,
      name: newUserName.trim(),
      role: newUserRole,
      dept: newUserDept.trim()
    });

    setIsSubmitting(false);

    if (res && res.success === false) {
      setErrorMessage(res.message || "계정 생성에 실패했습니다.");
      return;
    }

    // Reset Form
    setNewUserId('');
    setNewUserName('');
    setNewUserRole('SEC_MANAGER');
    setNewUserDept('보안운영팀');
    setShowCreateModal(false);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>유저 관리 및 계정 생성 (User Management)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            PostgreSQL <code style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>admin_users</code> 테이블과 실시간 연동되는 운영 계정 관리
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setErrorMessage(''); setShowCreateModal(true); }}>
          👤 신규 관리 계정 등록 (PostgreSQL 저장)
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>계정 ID</th>
                <th>성명</th>
                <th>소속 부서</th>
                <th>권한 등급</th>
                <th>계정 상태</th>
                <th>생성 일시</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    등록된 계정이 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.dept || "보안운영팀"}</td>
                    <td>
                      <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-danger' : (user.role === 'SEC_MANAGER' ? 'badge-info' : 'badge-success')}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="pulse-indicator pulse-green" />
                        <span style={{ fontSize: '0.8rem' }}>DB 활성 상태</span>
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {user.createdAt || "2026-06-15 11:20"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">
              <h3>신규 운영 관리자 등록 (PostgreSQL 영구 저장)</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            
            {errorMessage && (
              <div style={{
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)',
                fontSize: '0.85rem'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">계정 ID (로그인에 사용)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: security_tester"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">운영자 성명</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: 홍길동"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">권한 등급</label>
                <select
                  className="form-control"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (전체 통제)</option>
                  <option value="SEC_MANAGER">SEC_MANAGER (세션/로그)</option>
                  <option value="SYSTEM_USER">SYSTEM_USER (모니터링 전용)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">소속 부서명</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'DB 저장 중...' : '계정 등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
