import React, { useState } from 'react';

export default function RedirectDemo({ onAddSession }) {
  const [step, setStep] = useState(0);
  const [targetSystem, setTargetSystem] = useState('https://erp.enterprise-internal.com');
  const [pcInfoCollected, setPcInfoCollected] = useState(null);
  const [ipCollected, setIpCollected] = useState('');
  const [riskEvaluation, setRiskEvaluation] = useState(null);
  const [issuedToken, setIssuedToken] = useState('');

  const startRedirectFlow = () => {
    setStep(1);
    setPcInfoCollected(null);
    setRiskEvaluation(null);
    setIssuedToken('');

    // Step 1: Client Communication (C# WPF Agent)
    setTimeout(() => {
      const mockPc = {
        hostname: "SEC-DESKTOP-551",
        os: "Windows 11 Enterprise x64",
        macAddress: "E4-A8-DF-65-88-1A",
        agentVersion: "1.5.0",
        hasDebugger: false
      };
      setPcInfoCollected(mockPc);
      setStep(2);

      // Step 2: Request IP detection
      setTimeout(() => {
        setIpCollected("192.168.10.12");
        setStep(3);

        // Step 3: Evaluate Risk Factors
        setTimeout(() => {
          setRiskEvaluation({
            score: 0,
            level: 'LOW',
            status: 'SAFE'
          });
          setStep(4);

          // Step 4: Write to Redis (세션 만들기)
          setTimeout(() => {
            const mockToken = "sess_jwt_" + Math.random().toString(36).substr(2, 9);
            setIssuedToken(mockToken);
            
            // Add session to global state
            onAddSession({
              userId: "employee_sim",
              ip: "192.168.10.12",
              clientType: 'WPF',
              macAddress: "E4-A8-DF-65-88-1A",
              os: "Windows 11 Enterprise x64",
              browser: "C# WPF WinHTTP Agent",
              riskLevel: 'LOW'
            });

            setStep(5);
          }, 1500);
        }, 1200);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>타겟 시스템 리다이렉트 흐름 (Redirect Flow)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          사용자가 웹 페이지 접근 시 C# Client 에이전트와 통신하여 PC 정보 수집, Redis 세션 발급 후 최종 목적지로 리다이렉트하는 과정 시뮬레이션
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Side: Target Selection Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>🔗 리다이렉트 목적지 설정</h3>
          <div className="form-group">
            <label className="form-label">최종 Target System URL</label>
            <input
              type="text"
              className="form-control"
              value={targetSystem}
              onChange={(e) => setTargetSystem(e.target.value)}
              disabled={step > 0 && step < 5}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">테스트 계정명</label>
            <input
              type="text"
              className="form-control"
              value="employee_sim"
              disabled
            />
          </div>

          <button
            onClick={startRedirectFlow}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
            disabled={step > 0 && step < 5}
          >
            {step > 0 && step < 5 ? '시뮬레이션 진행 중...' : '통신 및 세션 생성 시작'}
          </button>

          {step === 5 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                ✓ 리다이렉트 준비 완료
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Redis 세션이 발급되었으며, 브라우저가 아래 주소로 즉시 이동합니다:
              </p>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {targetSystem}?token={issuedToken}
              </div>
              <button
                className="btn btn-success"
                style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}
                onClick={() => setStep(0)}
              >
                시뮬레이션 초기화
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Flow Visualization Map */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>📊 C# Client & Redis 세션 연동 파이프라인</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            
            {/* Connection Line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              backgroundColor: 'var(--border-color)',
              zIndex: '1'
            }} />

            {/* Step 1: WPF Agent Connection */}
            <div style={{ display: 'flex', gap: '1rem', zIndex: '2' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: step >= 1 ? 'white' : 'var(--text-muted)'
              }}>
                1
              </div>
              <div style={{ flex: '1' }}>
                <h4 style={{ color: step >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>C# WPF 에이전트 PC 정보 수집 (pcinfo)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  로컬 WPF 데바이스 모듈(WinHTTP)을 호출하여 MAC 주소, 실행 프로그램 디버거 탐지, 가상화 여부 등의 하드웨어 고유 키 추출
                </p>
                {step === 1 && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>에이전트 통신 수신 대기 중...</span>}
                {pcInfoCollected && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Host: {pcInfoCollected.hostname} | OS: {pcInfoCollected.os} | MAC: {pcInfoCollected.macAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Request IP Extract */}
            <div style={{ display: 'flex', gap: '1rem', zIndex: '2' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: step >= 2 ? 'white' : 'var(--text-muted)'
              }}>
                2
              </div>
              <div style={{ flex: '1' }}>
                <h4 style={{ color: step >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>네트워크 IP 조회 (ip request)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  클라이언트의 웹 리퀘스트로부터 게이트웨이 IP를 획득하여 접속 인프라 망 안정성 대조
                </p>
                {step === 2 && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>접속 세션 IP 획득 중...</span>}
                {step >= 3 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600', marginTop: '0.25rem' }}>
                    감지된 IP: {ipCollected}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Risk Factor Assessment */}
            <div style={{ display: 'flex', gap: '1rem', zIndex: '2' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 3 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: step >= 3 ? 'white' : 'var(--text-muted)'
              }}>
                3
              </div>
              <div style={{ flex: '1' }}>
                <h4 style={{ color: step >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>보안 위협 요소 감지 (riskfactor)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  수집된 PC Info와 IP를 대조하여 프록시, 가상 환경, 디버거 우회 시도 매칭 연산 수행
                </p>
                {step === 3 && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>위험 요소 패턴 매칭 엔진 작동 중...</span>}
                {riskEvaluation && (
                  <span className="badge badge-success" style={{ marginTop: '0.5rem' }}>
                    위험 검사 결과: {riskEvaluation.status} (등급: {riskEvaluation.level})
                  </span>
                )}
              </div>
            </div>

            {/* Step 4: Write Session to Redis */}
            <div style={{ display: 'flex', gap: '1rem', zIndex: '2' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 4 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: step >= 4 ? 'white' : 'var(--text-muted)'
              }}>
                4
              </div>
              <div style={{ flex: '1' }}>
                <h4 style={{ color: step >= 4 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Redis 분산 세션 등록 (세션 만들기)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  검증된 사용자 세션을 고속 캐시 메모리(Redis Cluster)에 적재하여 타겟 사이트 접근용 보안 일회성 토큰 발급
                </p>
                {step === 4 && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Redis Key-Value 캐시 쓰기 진행 중...</span>}
                {issuedToken && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(20, 184, 166, 0.05)',
                    border: '1px solid rgba(20, 184, 166, 0.2)',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-teal)'
                  }}>
                    REDIS SET {issuedToken} = "employee_sim" (EXPIRE 7200s)
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
