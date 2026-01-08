import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import eXpensioLogo from '../assets/logoOnboarding.png';
import loginPageIllustration from '../assets/loginPageIllustration.png';
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
            // Simulate API call delay
            setTimeout(() => {
                setIsLoading(false);
                navigate('/verify-otp', {
                    state: {
                        phoneNumber: `${countryCode}${phoneNumber}`,
                        mode: 'login'
                    }
                });
            }, 1500);
        }
    };

    return (
        <div className="auth-container">
            {/* Top Section: Logo, Title, Image */}
            <div className="auth-top-section">
                <div className="auth-header-top">
                    <img src={eXpensioLogo} alt="eXpensio Logo" className="auth-logo-top" />
                    <h1 className="auth-welcome-text">Welcome Back</h1>
                </div>

                <motion.div
                    className="auth-hero-image"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <img src={loginPageIllustration} alt="Login Illustration" />
                </motion.div>
            </div>

            {/* Bottom Sheet: Form */}
            <motion.div
                className="auth-bottom-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                <h2 className="sheet-title">Sign in to continue</h2>

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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={phoneNumber.length < 10 || isLoading}
                    >
                        {isLoading ? '' : 'SEND OTP'}
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
