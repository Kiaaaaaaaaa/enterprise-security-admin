import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SessionManager from './components/SessionManager';
import AuditLogs from './components/AuditLogs';
import CodeManager from './components/CodeManager';
import UserManager from './components/UserManager';
import RedirectDemo from './components/RedirectDemo';
import { 
  checkBackendHealth, 
  isBackendOnline, 
  fetchSessionsApi, 
  createSessionApi, 
  renewSessionApi, 
  deleteSessionApi, 
  fetchAuditLogsApi, 
  createAuditLogApi, 
  fetchUsersApi, 
  createUserApi 
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('CHECKING'); // CHECKING, ONLINE, OFFLINE

  // 1. Initial Local Mock Databases (used as offline fallbacks)
  const [sessions, setSessions] = useState([
    {
      id: "sess_f32ea891-b3b4-42f5-b9f1-d0b830ac9a34",
      userId: "operator_min",
      clientType: "WPF",
      ip: "192.168.10.15",
      macAddress: "B4-2E-99-C1-88-EF",
      os: "Windows 10 Pro x64",
      browser: "WPF Client Embedded",
      expiresIn: 84,
      riskLevel: "LOW",
      status: "ACTIVE"
    },
    {
      id: "sess_a88190ce-1c4b-4b11-a8bb-e0f39ac8ccb1",
      userId: "manager_kim",
      clientType: "WEB",
      ip: "211.234.56.90",
      macAddress: "E0-C9-A6-FD-11-22",
      os: "MacOS Sonoma v14.4",
      browser: "Safari 17.4",
      expiresIn: 112,
      riskLevel: "MEDIUM",
      status: "ACTIVE"
    },
    {
      id: "sess_d78f2441-fa1a-4c28-98e9-d7bc0d88ca12",
      userId: "malicious_hack",
      clientType: "WPF",
      ip: "45.138.22.109",
      macAddress: "00-50-56-C0-00-08",
      os: "Windows 11 Enterprise x64",
      browser: "x64dbg Debugger Process Attached",
      expiresIn: 5,
      riskLevel: "HIGH",
      status: "ACTIVE"
    }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      timestamp: "2026-06-16 09:44:12",
      userId: "malicious_hack",
      action: "C# Client: 디버깅 도구 실행 감지",
      actionCategory: "SECURITY_WARN",
      detail: "WinAPI CheckRemoteDebuggerPresent=True | x64dbg.exe",
      ip: "45.138.22.109",
      pcInfo: "Windows 11 | MAC: 00-50-56-C0-00-08"
    },
    {
      id: 2,
      timestamp: "2026-06-16 09:40:22",
      userId: "manager_kim",
      action: "웹 통합 관리자 로그인 승인",
      actionCategory: "LOGIN",
      detail: "ID/PW 인증성공 | 세션발급 완료",
      ip: "211.234.56.90",
      pcInfo: "MacOS Sonoma | Safari 17.4"
    }
  ]);

  const [users, setUsers] = useState([
    { id: 'admin', name: '최고 관리자', role: 'SUPER_ADMIN', dept: '정보보안본부', createdAt: '2026-06-01 10:00' },
    { id: 'manager_kim', name: '김동현 팀장', role: 'SEC_MANAGER', dept: '인프라운영팀', createdAt: '2026-06-10 14:30' }
  ]);

  // Load initial data from Spring Boot if available
  const syncWithBackend = async () => {
    const online = await checkBackendHealth();
    setBackendStatus(online ? 'ONLINE' : 'OFFLINE');
    
    // Fetch and load data
    const backendSessions = await fetchSessionsApi(sessions);
    setSessions(backendSessions);

    const backendLogs = await fetchAuditLogsApi(auditLogs);
    setAuditLogs(backendLogs);

    const backendUsers = await fetchUsersApi(users);
    setUsers(backendUsers);
  };

  useEffect(() => {
    syncWithBackend();
    // Periodically probe backend state every 5 seconds
    const interval = setInterval(syncWithBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    
    // Add audit log
    const logData = {
      userId: user.id,
      action: "관리자 콘솔 인증 완료",
      actionCategory: "LOGIN",
      detail: `PC Info & IP 검증 통과 | OS: ${user.pcInfo?.os}`,
      ip: user.pcInfo?.ip || "127.0.0.1",
      pcInfo: `${user.pcInfo?.os} | MAC: ${user.pcInfo?.macAddress}`
    };

    createAuditLogApi(logData).then(() => {
      // Refresh logs
      syncWithBackend();
    });

    // Fallback local update if offline
    if (backendStatus !== 'ONLINE') {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        ...logData
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleCreateSession = async (newSess) => {
    const sessionDto = {
      id: "sess_" + Math.random().toString(36).substr(2, 9) + "-" + Math.random().toString(36).substr(2, 9),
      ...newSess,
      expiresIn: 120,
      status: "ACTIVE"
    };

    const success = await createSessionApi(sessionDto);
    if (success) {
      syncWithBackend();
    } else {
      // Local fallback
      setSessions(prev => [sessionDto, ...prev]);
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser?.id || "SYSTEM",
        action: "신규 임의 세션 발급 (CRUD)",
        actionCategory: "SESSION_OP",
        detail: `사용자: ${newSess.userId} | IP: ${newSess.ip} | MAC: ${newSess.macAddress}`,
        ip: currentUser?.pcInfo?.ip || "127.0.0.1",
        pcInfo: currentUser?.pcInfo?.os || "Console Admin"
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRenewSession = async (id) => {
    const success = await renewSessionApi(id);
    if (success) {
      syncWithBackend();
    } else {
      // Local fallback
      setSessions(prev => prev.map(s => {
        if (s.id === id) {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userId: currentUser?.id || "SYSTEM",
            action: "Redis 사용자 세션 갱신 (세션갱신)",
            actionCategory: "SESSION_OP",
            detail: `대상 유저: ${s.userId} | 연장 시간: +120분`,
            ip: currentUser?.pcInfo?.ip || "127.0.0.1",
            pcInfo: currentUser?.pcInfo?.os || "Console Admin"
          };
          setAuditLogs(logs => [newLog, ...logs]);
          return { ...s, expiresIn: 120 };
        }
        return s;
      }));
    }
  };

  const handleForceLogout = async (id) => {
    const success = await deleteSessionApi(id);
    if (success) {
      syncWithBackend();
    } else {
      // Local fallback
      setSessions(prev => prev.map(s => {
        if (s.id === id) {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userId: currentUser?.id || "SYSTEM",
            action: "C# WPF / 웹 세션 강제 종료 (강제로그아웃)",
            actionCategory: "FORCE_LOGOUT",
            detail: `대상 유저: ${s.userId} | IP: ${s.ip} | MAC: ${s.macAddress}`,
            ip: currentUser?.pcInfo?.ip || "127.0.0.1",
            pcInfo: currentUser?.pcInfo?.os || "Console Admin"
          };
          setAuditLogs(logs => [newLog, ...logs]);
          return { ...s, status: "FORCE_TERMINATED", expiresIn: 0 };
        }
        return s;
      }));
    }
  };

  const handleCreateUser = async (newUser) => {
    const success = await createUserApi(newUser);
    if (success) {
      syncWithBackend();
    } else {
      // Local fallback
      const userRecord = {
        ...newUser,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setUsers(prev => [...prev, userRecord]);

      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser?.id || "SYSTEM",
        action: "신규 보안 관리자 계정 생성 (계정생성)",
        actionCategory: "CONFIG",
        detail: `ID: ${newUser.id} | 등급: ${newUser.role} | 부서: ${newUser.dept}`,
        ip: currentUser?.pcInfo?.ip || "127.0.0.1",
        pcInfo: currentUser?.pcInfo?.os || "Console Admin"
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard sessions={sessions} auditLogs={auditLogs} users={users} />;
      case 'sessions':
        return (
          <SessionManager
            sessions={sessions}
            onCreateSession={handleCreateSession}
            onRenewSession={handleRenewSession}
            onForceLogout={handleForceLogout}
          />
        );
      case 'audit':
        return <AuditLogs auditLogs={auditLogs} />;
      case 'code':
        return <CodeManager />;
      case 'users':
        return <UserManager users={users} onCreateUser={handleCreateUser} />;
      case 'redirect':
        return <RedirectDemo onAddSession={handleCreateSession} />;
      default:
        return <Dashboard sessions={sessions} auditLogs={auditLogs} users={users} />;
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '800' }}>SECURITY PORTAL</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vite + React Admin Console</span>
          </div>
        </div>

        <nav style={{ flexGrow: 1, padding: '1.5rem 0' }}>
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>📊 대시보드 홈</div>
          <div className={`nav-item ${currentView === 'sessions' ? 'active' : ''}`} onClick={() => setCurrentView('sessions')}>⚡ Redis 세션 관리</div>
          <div className={`nav-item ${currentView === 'audit' ? 'active' : ''}`} onClick={() => setCurrentView('audit')}>📋 보안 감사 로그</div>
          <div className={`nav-item ${currentView === 'code' ? 'active' : ''}`} onClick={() => setCurrentView('code')}>⚙️ 공통 코드 관리</div>
          <div className={`nav-item ${currentView === 'users' ? 'active' : ''}`} onClick={() => setCurrentView('users')}>👤 사용자 관리</div>
          <div className={`nav-item ${currentView === 'redirect' ? 'active' : ''}`} onClick={() => setCurrentView('redirect')}>🔗 리다이렉트 데모</div>
        </nav>

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}>🔒 로그아웃</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              서버 상태:
            </span>
            <span className={`badge ${backendStatus === 'ONLINE' ? 'badge-success' : (backendStatus === 'OFFLINE' ? 'badge-warning' : 'badge-info')}`}>
              {backendStatus === 'ONLINE' ? 'Spring Boot: ONLINE' : (backendStatus === 'OFFLINE' ? 'Spring Boot: OFFLINE (Mock Mode)' : 'Checking Backend...')}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className={`pulse-indicator ${backendStatus === 'ONLINE' ? 'pulse-green' : 'pulse-orange'}`} /> Redis 클러스터
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className={`pulse-indicator ${backendStatus === 'ONLINE' ? 'pulse-green' : 'pulse-orange'}`} /> JPA DB (PostgreSQL)
              </span>
            </div>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }} />
            <div style={{ fontSize: '0.85rem' }}>
              접속 IP: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{currentUser.pcInfo?.ip}</code>
            </div>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  );
}
