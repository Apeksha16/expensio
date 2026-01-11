import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import loginIllustration from '../assets/logoOnboarding.png'; // Using Logo as requested
import CountrySelector from './CountrySelector';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (phoneNumber.length >= 10) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                navigate('/verify-otp', {
                    state: {
                        phoneNumber: `${countryCode}${phoneNumber}`,
                        mode: 'login'
                    }
                });
            }, 1000);
        }
    };

    return (
        <div className="auth-container">
            {/* Top Illustration Area */}
            {/* Top Logo Area */}
            <div className="auth-illustration-area">
                <div className="floating-circle fc-1"></div>
                <div className="floating-circle fc-2"></div>
                <motion.div
                    className="logo-container-large"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <img src={loginIllustration} alt="eXpensio Logo" className="auth-main-logo" />
                </motion.div>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                className="auth-bottom-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
            >
                <div className="sheet-handle"></div>

                <div className="auth-header-section">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login to manage your finances</p>
                </div>

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <div className="input-wrapper">
                            <div className="country-selector-wrapper">
                                <CountrySelector
                                    value={countryCode}
                                    onChange={setCountryCode}
                                />
                            </div>
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="auth-input"
                                required
                                minLength="10"
                                maxLength="15"
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className={`auth-button ${isLoading ? 'loading' : ''}`}
                        whileTap={{ scale: 0.98 }}
                        disabled={phoneNumber.length < 10 || isLoading}
                    >
                        {isLoading ? '' : 'Get OTP'}
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <span>New here?</span>
                    <Link to="/signup" className="auth-link">Create Account</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
