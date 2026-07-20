import { useRef } from 'react';
import { Calendar } from 'lucide-react';

const CustomDateInput = ({ value, onChange, placeholder = "dd/mm/yyyy", className = "", style = {}, required = false, disabled = false }) => {
  const dateInputRef = useRef(null);

  const formatDateToDMY = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleWrapperClick = () => {
    if (disabled) return;
    if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        console.error("Failed to show picker:", err);
      }
    }
  };

  return (
    <div 
      className={`custom-date-input-wrapper ${className}`} 
      style={{ position: 'relative', width: '100%', cursor: 'pointer', ...style }}
      onClick={handleWrapperClick}
    >
      <input
        type="text"
        className="auth-input custom-date-display"
        style={{ 
          width: '100%', 
          cursor: 'pointer', 
          paddingRight: '40px',
          paddingLeft: '14px',
          background: 'transparent'
        }}
        placeholder={placeholder}
        value={formatDateToDMY(value)}
        readOnly
        required={required}
        disabled={disabled}
      />
      <Calendar 
        size={18} 
        className="custom-date-icon" 
        style={{
          position: 'absolute',
          right: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          pointerEvents: 'none'
        }}
      />
      <input
        ref={dateInputRef}
        type="date"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: -1,
          pointerEvents: 'none'
        }}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default CustomDateInput;
