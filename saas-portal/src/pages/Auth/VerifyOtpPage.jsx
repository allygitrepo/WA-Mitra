import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../api/services';
import { motion, AnimatePresence } from 'framer-motion';
import './Auth.css';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const lastSubmittedCode = useRef('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const email = location.state?.email || '';

  const handleChange = (value, index) => {
    if (value && isNaN(value)) return;
    
    const singleVal = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleVal;
    setOtp(newOtp);

    // Auto-focus next input
    if (singleVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  const submitOtp = async (code) => {
    if (code === lastSubmittedCode.current) return;
    lastSubmittedCode.current = code;

    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyOtp({ email, otp: code });
      setAuth(res.data.user, res.data.token, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
      lastSubmittedCode.current = '';
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 6) {
      submitOtp(code);
    } else {
      setError('Please enter a 6-digit code');
    }
  };

  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6) {
      submitOtp(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('No email found. Please register again.');
      return;
    }
    const loadingToast = toast.loading("Resending OTP...");
    try {
      const res = await authService.resendOtp({ email });
      toast.success(res.data?.message || "OTP resent successfully!", { id: loadingToast });
      setError('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend OTP';
      toast.error(errMsg, { id: loadingToast });
      setError(errMsg);
    }
  };

  // Framer Motion Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 22 
      } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      } 
    }
  };

  const inputContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const inputCellVariants = {
    hidden: { opacity: 0, scale: 0.7, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 18 
      }
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="auth-header" variants={itemVariants}>
            <div className="auth-logo">
              <div className="logo-icon"></div>
              <span>WA-Mitra</span>
            </div>
            <h2>Verify Email</h2>
            <p>We sent a code to <strong style={{ color: 'var(--primary)' }}>{email}</strong></p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                className="auth-error-msg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleVerify}>
            <motion.div 
              className="otp-inputs"
              variants={inputContainerVariants}
              animate={error ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {otp.map((data, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  className="otp-input"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  required
                  variants={inputCellVariants}
                  animate={data ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  whileFocus={{ 
                    scale: 1.08,
                    borderColor: "var(--primary)",
                    boxShadow: "0 0 10px rgba(0, 168, 132, 0.25)"
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    scale: { duration: 0.15 } 
                  }}
                />
              ))}
            </motion.div>

            <motion.button 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Verifying...' : 'Verify Code'} <ShieldCheck size={18} />
            </motion.button>
          </form>

          <motion.div className="auth-footer" variants={itemVariants}>
            Didn't receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Resend Code
            </button>
          </motion.div>
          
          <motion.div style={{textAlign: 'center', marginTop: '1rem'}} variants={itemVariants}>
            <Link to="/register" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-muted)'}}>
              <ArrowLeft size={14} /> Back to register
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyOtpPage;
