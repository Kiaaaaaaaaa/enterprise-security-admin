import React, { useState, useEffect } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [loadingStep, setLoadingStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clientPcInfo, setClientPcInfo] = useState(null);

  // Mock gathering client PC Info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientPcInfo({
        os: "Windows 11 Enterprise x64",
        browser: navigator.userAgent.split(') ')[0].split(' (')[1] || "Chrome 125.0.0",
        ip: "211.234.56.78",
        macAddress: "E4-A8-DF-92-11-BC",
        hostname: "SEC-DESKTOP-889",
        isVirtual: false,
        debuggerDetected: false
      });
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsAnalyzing(true);
    setLoadingStep(1);

    // Step 1: Collect PC Info
    setTimeout(() => {
      setLoadingStep(2);
      // Step 2: Extract Request IP & C# Client Agent Handshake
      setTimeout(() => {
        setLoadingStep(3);
        // Step 3: Risk Factor Analysis (Multiple IPs, Debuggers)
        setTimeout(() => {
          setIsAnalyzing(false);
          onLoginSuccess({
            id: username,
            role: "SUPER_ADMIN",
            name: "최고 관리자",
            pcInfo: clientPcInfo
          });
        }, 1200);
      }, 1000);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Enterprise Security Admin
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            관리자 웹 콘솔 통합 인증 데모
          </p>
        </div>

        {!isAnalyzing ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">관리자 계정 ID</label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ID를 입력하세요"
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
              인증 및 세션 연결 시작
            </button>
            
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <strong>데모 계정:</strong> admin / admin1234
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
            {/* Spinning Circle */}
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(59, 130, 246, 0.1)',
              borderTop: '3px solid var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '2rem'
            }} />
            
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>보안 분석 진행 중...</h3>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: loadingStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <span className={`pulse-indicator ${loadingStep >= 1 ? 'pulse-green' : 'pulse-orange'}`} />
                <span>[1단계] PC 정보 수집 및 에이전트 검증</span>
                {loadingStep >= 1 && <span style={{ marginLeft: 'auto', color: 'var(--accent-teal)', fontSize: '0.75rem' }}>완료</span>}
              </div>
              {loadingStep >= 1 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                  OS: {clientPcInfo?.os} | MAC: {clientPcInfo?.macAddress}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: loadingStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <span className={`pulse-indicator ${loadingStep >= 2 ? 'pulse-green' : (loadingStep === 1 ? 'pulse-orange' : 'pulse-red')}`} />
                <span>[2단계] 요청 IP 대역 및 네트워크 검증</span>
                {loadingStep >= 2 && <span style={{ marginLeft: 'auto', color: 'var(--accent-teal)', fontSize: '0.75rem' }}>완료</span>}
              </div>
              {loadingStep >= 2 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                  Request IP: {clientPcInfo?.ip} (Korea Telecom)
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: loadingStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <span className={`pulse-indicator ${loadingStep >= 3 ? 'pulse-green' : (loadingStep === 2 ? 'pulse-orange' : 'pulse-red')}`} />
                <span>[3단계] 위험요소(Risk Factors) 분석 평가</span>
                {loadingStep >= 3 && <span style={{ marginLeft: 'auto', color: 'var(--accent-teal)', fontSize: '0.75rem' }}>완료 (위험도: 낮음)</span>}
              </div>
              {loadingStep >= 3 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                  디버거 미검출 | VM 환경 아님 | 세션 무결성 검증 완료
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
