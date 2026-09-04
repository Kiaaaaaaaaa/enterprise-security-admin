import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SessionManager from './components/SessionManager';
import AuditLogs from './components/AuditLogs';
import CodeManager from './components/CodeManager';
import UserManager from './components/UserManager';
import RedirectDemo from './components/RedirectDemo';
import { 
  checkBackendHealth, 
  fetchSessionsApi, 
  createSessionApi, 
  renewSessionApi, 
  deleteSessionApi, 
  fetchAuditLogsApi, 
  createAuditLogApi, 
  fetchUsersApi, 
  createUserApi,
  fetchCodesApi,
  fetchSystemMetricsApi,
  fetchClientInfoApi
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('CHECKING'); // CHECKING, ONLINE, OFFLINE
  const [clientInfo, setClientInfo] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);

  // 1. Initial State Data (synced live from PostgreSQL and Redis)
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);

  // Load live data from Spring Boot PostgreSQL & Redis
  const syncWithBackend = useCallback(async () => {
    const online = await checkBackendHealth();
    setBackendStatus(online ? 'ONLINE' : 'OFFLINE');
    
    if (online) {
      const [backendSessions, backendLogs, backendUsers, backendCodes, metrics, cInfo] = await Promise.all([
        fetchSessionsApi(sessions),
        fetchAuditLogsApi(auditLogs),
        fetchUsersApi(users),
        fetchCodesApi(codes),
        fetchSystemMetricsApi(),
        fetchClientInfoApi()
      ]);

      if (backendSessions) setSessions(backendSessions);
      if (backendLogs) setAuditLogs(backendLogs);
      if (backendUsers) setUsers(backendUsers);
      if (backendCodes) setCodes(backendCodes);
      if (metrics) setSystemMetrics(metrics);
      if (cInfo) setClientInfo(cInfo);
    }
  }, [sessions, auditLogs, users, codes]);

  useEffect(() => {
    syncWithBackend();
    // Periodically probe backend state every 5 seconds for live real-time sync
    const interval = setInterval(syncWithBackend, 5000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Actions
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    syncWithBackend();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleCreateSession = async (newSess) => {
    const defaultTtl = Number(codes.find(c => c.code === 'SESSION_EXPIRY')?.val || 120);
    const sessionDto = {
      id: "sess_" + Math.random().toString(36).substr(2, 9) + "-" + Math.random().toString(36).substr(2, 9),
      ...newSess,
      expiresIn: newSess.expiresIn || defaultTtl,
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
        ip: currentUser?.pcInfo?.ip || clientInfo?.ip || "127.0.0.1",
        pcInfo: currentUser?.pcInfo?.os || clientInfo?.os || "Console Admin"
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
            ip: currentUser?.pcInfo?.ip || clientInfo?.ip || "127.0.0.1",
            pcInfo: currentUser?.pcInfo?.os || clientInfo?.os || "Console Admin"
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
            ip: currentUser?.pcInfo?.ip || clientInfo?.ip || "127.0.0.1",
            pcInfo: currentUser?.pcInfo?.os || clientInfo?.os || "Console Admin"
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
        ip: currentUser?.pcInfo?.ip || clientInfo?.ip || "127.0.0.1",
        pcInfo: currentUser?.pcInfo?.os || clientInfo?.os || "Console Admin"
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            sessions={sessions} 
            auditLogs={auditLogs} 
            users={users} 
            codes={codes}
            systemMetrics={systemMetrics}
            clientInfo={clientInfo}
          />
        );
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
        return <CodeManager codes={codes} onRefreshCodes={syncWithBackend} />;
      case 'users':
        return <UserManager users={users} onCreateUser={handleCreateUser} />;
      case 'redirect':
        return (
          <RedirectDemo 
            users={users} 
            codes={codes}
            clientInfo={clientInfo} 
            onAddSession={handleCreateSession} 
          />
        );
      default:
        return (
          <Dashboard 
            sessions={sessions} 
            auditLogs={auditLogs} 
            users={users} 
            codes={codes}
            systemMetrics={systemMetrics}
            clientInfo={clientInfo}
          />
        );
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentUser.role} ({currentUser.dept || '보안본부'})</div>
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
              {backendStatus === 'ONLINE' ? 'Spring Boot: ONLINE (PostgreSQL + Redis)' : (backendStatus === 'OFFLINE' ? 'Spring Boot: OFFLINE (Mock Mode)' : 'Checking Backend...')}
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
              접속 IP: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{currentUser.pcInfo?.ip || clientInfo?.ip || '127.0.0.1'}</code>
            </div>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  );
}
