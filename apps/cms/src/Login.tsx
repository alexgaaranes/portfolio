import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './api';
import { QRCodeSVG } from 'qrcode.react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpStatus, setTotpStatus] = useState<'idle' | 'setup' | 'required'>('idle');
  const [totpSecret, setTotpSecret] = useState('');
  const [provisioningUrl, setProvisioningUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await login({ username, password });
      if (res.data.status === 'totp_setup') {
        setTotpSecret(res.data.totp_secret);
        setProvisioningUrl(res.data.provisioning_url);
        setTotpStatus('setup');
      } else if (res.data.status === 'totp_required') {
        setTotpStatus('required');
      } else if (res.data.access) {
        localStorage.setItem('token', res.data.access);
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Login credentials invalid.');
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload: any = { username, password, totp_code: totpCode };
      if (totpStatus === 'setup') {
        payload.totp_secret_setup = totpSecret;
      }
      const res = await login(payload);
      if (res.data.access) {
        localStorage.setItem('token', res.data.access);
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid verification code.');
    }
  };

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '440px', margin: '10vh auto', backgroundColor: '#fcfcfc', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem', color: '#333' }}>CMS Administration</h1>
      
      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      {totpStatus === 'idle' && (
        <form onSubmit={handleCredentialsSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: '600', color: '#555', fontSize: '0.9rem' }}>Username</label>
            <input 
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.25rem', boxSizing: 'border-box' }}
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: '#555', fontSize: '0.9rem' }}>Password</label>
            <input 
              type="password" 
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.25rem', boxSizing: 'border-box' }}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#e53935', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Continue
          </button>
        </form>
      )}

      {totpStatus === 'setup' && (
        <form onSubmit={handleMfaSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Enrolling Multi-Factor Auth</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
              Scan the QR code below using your authenticator app (such as Microsoft Authenticator or Google Authenticator) to register your account.
            </p>
            <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #eee', display: 'inline-block', borderRadius: '4px', marginBottom: '1rem' }}>
              <QRCodeSVG value={provisioningUrl} size={180} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#777', backgroundColor: '#f1f1f1', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Secret Key: {totpSecret}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: '#555', fontSize: '0.9rem' }}>Enter 6-Digit Authenticator Code</label>
            <input 
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.25rem', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
              maxLength={6}
              placeholder="000000"
              value={totpCode} 
              onChange={e => setTotpCode(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#22c55e', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Verify and Register
          </button>
        </form>
      )}

      {totpStatus === 'required' && (
        <form onSubmit={handleMfaSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>MFA Challenge Required</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
              Open your Microsoft or Google Authenticator app and enter the 6-digit verification code associated with this account.
            </p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: '#555', fontSize: '0.9rem' }}>Enter 6-Digit Authenticator Code</label>
            <input 
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.25rem', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
              maxLength={6}
              placeholder="000000"
              value={totpCode} 
              onChange={e => setTotpCode(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#e53935', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Verify Code
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;
