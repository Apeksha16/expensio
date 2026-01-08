import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import eXpensioLogo from '../assets/logoOnboarding.png';
import loginPageIllustration from '../assets/loginPageIllustration.png'; // Reusing illustration for consistency
import './Login.css'; // Reusing Auth styles
import './OTPVerification.css';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    const phoneNumber = location.state?.phoneNumber || 'your number';

    useEffect(() => {
        // Auto-focus first input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }

        // Timer countdown
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp);
            // Focus the next empty input or last input
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length === 6) {
            setIsLoading(true);
            // Simulate API call
            setTimeout(() => {
                setIsLoading(false);
                navigate('/dashboard');
            }, 1500);
        }
    };

    const handleResend = () => {
        if (canResend) {
            setTimer(30);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            // Here you would call the resend OTP API
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 120
            }
        }
    };

    return (
        <div className="auth-container">
            {/* Top Section */}
            <div className="auth-top-section">
                <motion.button
                    className="back-button-custom"
                    onClick={handleBack}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '10px',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <ArrowLeft size={20} color="#1E293B" />
                </motion.button>

                <div className="auth-header-top">
                    <img src={eXpensioLogo} alt="eXpensio Logo" className="auth-logo-top" />
                    <h1 className="auth-welcome-text">Verification</h1>
                </div>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                className="auth-bottom-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                <div className="sheet-header">
                    <h2 className="sheet-title">Enter OTP</h2>
                    <p className="otp-subtitle" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.9rem', marginTop: '-4px' }}>
                        Code sent to <strong>{phoneNumber}</strong>
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleVerify}>
                    <motion.div className="otp-container" variants={itemVariants} initial="hidden" animate="visible">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className={`otp-input ${digit ? 'filled' : ''}`}
                                aria-label={`OTP digit ${index + 1}`}
                            />
                        ))}
                    </motion.div>

                    <motion.button
                        type="submit"
                        className={`auth-button ${isLoading ? 'loading' : ''}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        disabled={otp.join('').length < 6 || isLoading}
                        whileHover={{ scale: otp.join('').length === 6 ? 1.02 : 1 }}
                        whileTap={{ scale: otp.join('').length === 6 ? 0.98 : 1 }}
                    >
                        {isLoading ? '' : 'VERIFY & LOGIN'}
                    </motion.button>

                    <motion.div
                        className="resend-container"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ textAlign: 'center' }}
                    >
                        {!canResend ? (
                            <div className="resend-text" style={{ color: '#64748B', fontSize: '0.9rem' }}>
                                Resend code in <span className="timer" style={{ color: '#4A70A9', fontWeight: 600 }}>{timer}s</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="resend-button"
                                onClick={handleResend}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4A70A9',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Resend Code
                            </button>
                        )}
                    </motion.div>
                </form>
            </motion.div>
        </div>
    );
};

export default OTPVerification;
