import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import loginIllustration from '../assets/logoOnboarding.png'; // Using Logo as requested
import CountrySelector from './CountrySelector';
import './Login.css';

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        countryCode: '+91'
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            const cleanValue = value.replace(/\D/g, '');
            setFormData({ ...formData, [name]: cleanValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCountryChange = (countryCode) => {
        setFormData({ ...formData, countryCode });
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (formData.phoneNumber.length >= 10 && formData.fullName.trim()) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                navigate('/verify-otp', {
                    state: {
                        phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
                        mode: 'signup',
                        fullName: formData.fullName.trim()
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Start your financial journey</p>
                </div>

                <form className="auth-form" onSubmit={handleSignUp}>
                    <div className="input-group">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="auth-input"
                                style={{ paddingLeft: '8px' }}
                                required
                                minLength="2"
                                maxLength="50"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-wrapper">
                            <div className="country-selector-wrapper">
                                <CountrySelector
                                    value={formData.countryCode}
                                    onChange={handleCountryChange}
                                />
                            </div>
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
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
                        disabled={formData.phoneNumber.length < 10 || !formData.fullName.trim() || isLoading}
                    >
                        {isLoading ? '' : 'Sign Up'}
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <span>Already a member?</span>
                    <Link to="/login" className="auth-link">Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
