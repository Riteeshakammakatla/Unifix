import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

const AiInput = ({ value, onChange, placeholder, aiSuggestions = [], label }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Simple mock AI behavior
  const handleInput = (e) => {
    onChange(e.target.value);
    if (e.target.value.length > 5) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="input-group" style={{ position: 'relative' }}>
      {label && <label className="input-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <textarea
          className="input-field"
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          rows={3}
          style={{ paddingRight: 'var(--space-8)' }}
        />
        <Sparkles 
          size={18} 
          color="var(--color-primary)" 
          style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', opacity: 0.5 }}
        />
      </div>

      {showSuggestions && aiSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 20,
          marginTop: 'var(--space-1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: '#eff6ff', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles size={14} /> AI Suggestions
          </div>
          {aiSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiInput;
