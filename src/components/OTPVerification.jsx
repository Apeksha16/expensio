import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import eXpensioLogo from '../assets/logoOnboarding.png';
import './Login.css'; // Reusing Auth styles
import './OTPVerification.css';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digit OTP
    const inputRefs = useRef([]);

    const phoneNumber = location.state?.phoneNumber || 'your number';

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

    const handleVerify = (e) => {
        e.preventDefault();
        // Here verification logic
        navigate('/home');
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <motion.div
                    className="auth-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <img src={eXpensioLogo} alt="Logo" className="auth-logo" />
                    <h1 className="auth-title">Verify OTP</h1>
                    <p className="auth-subtitle">Enter the code sent to <br /><strong>{phoneNumber}</strong></p>
                </motion.div>

                <motion.form
                    className="auth-form"
                    onSubmit={handleVerify}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="otp-container">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="otp-input"
                            />
                        ))}
                    </div>

                    <button type="submit" className="primary-block-button">
                        VERIFY & LOGIN
                    </button>

                    <div className="auth-footer">
                        <p>Didn't receive code? <span className="auth-link" style={{ cursor: 'pointer' }}>Resend</span></p>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default OTPVerification;
