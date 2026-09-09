import { useState } from 'react';

export default function ApiKeyModal({ currentKey = '', onSave, onClose }) {
  const [apiKey, setApiKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onSave(apiKey.trim());
  };

  const handleClear = () => {
    setApiKey('');
    onSave('');
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(2, 5, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        width: '90%',
        maxWidth: '520px',
        padding: '36px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, rgba(10, 20, 38, 0.98), rgba(6, 12, 24, 0.99))',
        border: '1px solid rgba(0, 229, 255, 0.22)',
        boxShadow: '0 0 80px rgba(0, 229, 255, 0.15), 0 20px 60px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(200, 220, 255, 0.7)',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 100, 100, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.3)';
            e.currentTarget.style.color = '#ff7070';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(200, 220, 255, 0.7)';
          }}
        >
          ✕
        </button>

        <div style={{
          fontSize: '44px',
          textAlign: 'center',
          marginBottom: '12px',
          filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.4))',
        }}>
          🔐
        </div>

        <h2 style={{
          margin: '0 0 8px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#e8f6ff',
          textAlign: 'center',
          letterSpacing: '1px',
        }}>
          OpenRouter API Configuration
        </h2>
        <p style={{
          margin: '0 0 24px',
          fontSize: '12px',
          color: 'rgba(150, 180, 220, 0.6)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          إعداد مفتاح OpenRouter API للحصول على استجابات ذكية حقيقية
          <br />
          <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            Configure your OpenRouter API key for real AI responses
          </span>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'rgba(0, 229, 255, 0.8)',
            marginBottom: '8px',
          }}>
            API KEY · مفتاح الـ API
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx..."
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                fontSize: '13px',
                color: '#e0f4ff',
                background: 'rgba(5, 15, 30, 0.9)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '10px',
                outline: 'none',
                fontFamily: '"Consolas", "Monaco", monospace',
                letterSpacing: '0.3px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.6)';
                e.target.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.25)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                opacity: 0.6,
                padding: '4px',
              }}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={{
          padding: '12px 14px',
          marginBottom: '24px',
          borderRadius: '10px',
          background: 'rgba(0, 229, 255, 0.04)',
          border: '1px solid rgba(0, 229, 255, 0.12)',
          fontSize: '11px',
          color: 'rgba(150, 180, 220, 0.75)',
          lineHeight: 1.6,
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 600, color: 'rgba(0, 229, 255, 0.8)' }}>
            💡 Get your key from: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#00e5ff', textDecoration: 'underline' }}>openrouter.ai/keys</a>
          </div>
          <div style={{ opacity: 0.85 }}>
            {currentKey
              ? '✅ مفتاح محفوظ - يمكنك تحديثه أو مسحه'
              : '⚠️ بدون مفتاح: ستُستخدم ردود محددة مسبقاً فقط'}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
        }}>
          <button
            onClick={handleClear}
            disabled={!apiKey && !currentKey}
            style={{
              padding: '13px 20px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1px',
              color: '#ff9090',
              background: 'rgba(255, 100, 100, 0.06)',
              border: '1px solid rgba(255, 100, 100, 0.2)',
              borderRadius: '10px',
              cursor: (!apiKey && !currentKey) ? 'not-allowed' : 'pointer',
              opacity: (!apiKey && !currentKey) ? 0.4 : 1,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (apiKey || currentKey) {
                e.currentTarget.style.background = 'rgba(255, 100, 100, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 100, 100, 0.06)';
            }}
          >
            🗑️  CLEAR
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '13px 20px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1px',
              color: 'rgba(180, 210, 240, 0.85)',
              background: 'rgba(100, 160, 220, 0.06)',
              border: '1px solid rgba(100, 160, 220, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 160, 220, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(100, 160, 220, 0.06)';
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '13px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: '#00141a',
              background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 45px rgba(0, 229, 255, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.3)';
            }}
          >
            ✅  SAVE · حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
