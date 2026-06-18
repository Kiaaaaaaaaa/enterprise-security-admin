import React, { useState } from 'react';

export default function UserManager({ users, onCreateUser }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('SEC_MANAGER');
  const [newUserDept, setNewUserDept] = useState('보안운영팀');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUserId || !newUserName) return;

    onCreateUser({
      id: newUserId,
      name: newUserName,
      role: newUserRole,
      dept: newUserDept
    });

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
            보안 관리 도구를 운영하는 관리자 계정 조회 및 역할 권한 부여 기능
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          👤 신규 관리 계정 등록 (계정 생성)
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
              {users.map((user) => (
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
                      <span style={{ fontSize: '0.8rem' }}>정상 작동</span>
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {user.createdAt || "2026-06-15 11:20"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">
              <h3>신규 운영 관리자 등록</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">계정 ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: admin_sec"
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
                <label className="form-label">부서명</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">계정 생성 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
