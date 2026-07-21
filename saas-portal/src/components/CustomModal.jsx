import { useState, useEffect, useRef } from 'react';
import { AlertCircle, HelpCircle, Info, X } from 'lucide-react';
import './CustomModal.css';

const CustomModal = ({
  isOpen,
  type = 'confirm', // 'alert' | 'confirm' | 'prompt'
  title = 'Confirmation',
  message = 'Are you sure?',
  placeholder = 'Type here...',
  defaultValue = '',
  okText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      setTimeout(() => {
        if (active) {
          setInputValue(defaultValue);
        }
      }, 0);
      // Auto-focus on input if it is a prompt
      if (type === 'prompt') {
        setTimeout(() => {
          if (active && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 50);
      }
    }
    return () => {
      active = false;
    };
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'alert':
        return <Info className="modal-icon text-info" size={32} />;
      case 'prompt':
        return <AlertCircle className="modal-icon text-primary" size={32} />;
      default:
        return <HelpCircle className="modal-icon text-warning" size={32} />;
    }
  };

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-container">
        <button type="button" className="custom-modal-close" onClick={onCancel}>
          <X size={18} />
        </button>
        
        <form onSubmit={handleConfirm}>
          <div className="custom-modal-body">
            <div className="custom-modal-icon-container">
              {getIcon()}
            </div>
            
            <div className="custom-modal-content">
              <h3 className="custom-modal-title">{title}</h3>
              <p className="custom-modal-message">{message}</p>
              
              {type === 'prompt' && (
                <input
                  ref={inputRef}
                  type="text"
                  className="custom-modal-input"
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  required
                />
              )}
            </div>
          </div>
          
          <div className="custom-modal-actions">
            {type !== 'alert' && (
              <button
                type="button"
                className="custom-modal-btn btn-cancel"
                onClick={onCancel}
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              className={`custom-modal-btn ${type === 'alert' ? 'btn-alert-ok' : 'btn-confirm'}`}
            >
              {okText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomModal;
