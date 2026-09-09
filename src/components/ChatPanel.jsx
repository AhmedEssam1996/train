import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({
  messages = [],
  onSendMessage,
  isSpeaking = false,
  isThinking = false,
  isListening = false,
  transcript = '',
  isArabic = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isThinking && !isSpeaking) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusInfo = isListening
    ? { text: '🎙️ Listening...', color: '#00ffc8', textAr: '🎙️ يستمع...' }
    : isThinking
    ? { text: '🧠 Thinking...', color: '#b478ff', textAr: '🧠 يفكر...' }
    : isSpeaking
    ? { text: '🔊 Speaking...', color: '#ffc850', textAr: '🔊 يتحدث...' }
    : { text: '💬 Ready', color: '#64a0dc', textAr: '💬 جاهز' };

  return (
    <div style={{
      position: 'absolute',
      left: '28px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: isExpanded ? '340px' : '56px',
      maxHeight: '75vh',
      zIndex: 20,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          padding: isExpanded ? '14px 18px' : '16px',
          background: 'linear-gradient(135deg, rgba(8, 18, 36, 0.95), rgba(5, 12, 24, 0.95))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 229, 255, 0.18)',
          borderRadius: isExpanded ? '14px 14px 0 0' : '14px',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.08), 0 8px 40px rgba(0,0,0,0.4)',
          gap: '10px',
        }}
      >
        {isExpanded ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#e0f4ff',
              }}>
                CONVERSATION
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              color: statusInfo.color,
              fontWeight: 600,
              background: `${statusInfo.color}12`,
              padding: '4px 10px',
              borderRadius: '20px',
              border: `1px solid ${statusInfo.color}30`,
              letterSpacing: '0.5px',
            }}>
              {isArabic ? statusInfo.textAr : statusInfo.text}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '20px' }}>💬</span>
        )}
      </div>

      {isExpanded && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(5, 12, 24, 0.92)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(0, 229, 255, 0.15)',
          borderRight: '1px solid rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
        }}>
          <div
            ref={messagesEndRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '40vh',
              minHeight: messages.length === 0 ? '80px' : undefined,
            }}
          >
            {messages.length === 0 && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(140, 170, 210, 0.5)',
                fontSize: '12px',
                lineHeight: 1.6,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.6 }}>✨</div>
                <p style={{ margin: '0 0 6px' }}>
                  {isArabic
                    ? 'ابدأ التحدث وسأستجيب لك فوراً'
                    : 'Start speaking and I\'ll respond instantly'}
                </p>
                <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>
                  {isArabic
                    ? 'أو اكتب رسالة في الأسفل'
                    : 'Or type a message below'}
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const msgArabic = (msg.language || 'en').startsWith('ar');
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(64, 156, 255, 0.14))'
                      : 'linear-gradient(135deg, rgba(30, 50, 80, 0.8), rgba(20, 35, 60, 0.8))',
                    border: isUser
                      ? '1px solid rgba(0, 229, 255, 0.25)'
                      : '1px solid rgba(100, 160, 220, 0.15)',
                    direction: msgArabic ? 'rtl' : 'ltr',
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.8px',
                    color: isUser ? 'rgba(0, 229, 255, 0.7)' : 'rgba(150, 190, 230, 0.6)',
                    marginBottom: '4px',
                  }}>
                    {isUser
                      ? (isArabic ? 'أنت' : 'YOU')
                      : (isArabic ? 'حمصة' : 'HUMMUS')}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isUser ? '#d0f4ff' : 'rgba(210, 230, 250, 0.92)',
                    lineHeight: 1.55,
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </p>
                </div>
              );
            })}

            {isThinking && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 16px',
                background: 'rgba(30, 50, 80, 0.7)',
                borderRadius: '14px 14px 14px 4px',
                border: '1px solid rgba(180, 120, 255, 0.25)',
              }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#b478ff',
                        animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
                        boxShadow: '0 0 10px rgba(180, 120, 255, 0.6)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(0, 229, 255, 0.12)',
            background: 'rgba(3, 8, 16, 0.6)',
          }}>
            {transcript && isListening && (
              <div style={{
                padding: '8px 12px',
                marginBottom: '10px',
                borderRadius: '10px',
                background: 'rgba(0, 255, 200, 0.06)',
                border: '1px solid rgba(0, 255, 200, 0.15)',
                fontSize: '11px',
                color: 'rgba(0, 255, 200, 0.8)',
                fontStyle: 'italic',
                direction: isArabic ? 'rtl' : 'ltr',
              }}>
                🎤 "{transcript}"
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking || isSpeaking}
                placeholder={isArabic
                  ? 'اكتب رسالة هنا...'
                  : 'Type a message here...'}
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '12px',
                  color: '#e0f4ff',
                  background: 'rgba(10, 20, 40, 0.8)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  borderRadius: '10px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking || isSpeaking}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: !inputValue.trim() || isThinking || isSpeaking ? '#003845' : '#00141a',
                  background: !inputValue.trim() || isThinking || isSpeaking
                    ? 'rgba(0, 229, 255, 0.2)'
                    : 'linear-gradient(135deg, #00e5ff, #00b8d4)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: !inputValue.trim() || isThinking || isSpeaking ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div style={{
          height: '10px',
          background: 'rgba(5, 12, 24, 0.92)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          borderTop: 'none',
          borderRadius: '0 0 14px 14px',
        }} />
      )}

      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.2); border-radius: 3px; }
      `}</style>
    </div>
  );
}
