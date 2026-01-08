import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import eXpensioLogo from '../assets/logoOnboarding.png';
import loginPageIllustration from '../assets/loginPageIllustration.png'; // Reusing illustration
import CountrySelector from './CountrySelector';
import './Login.css'; // Reusing Auth styles

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
            // Only allow digits
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
            // Simulate API call delay
            setTimeout(() => {
                setIsLoading(false);
                navigate('/verify-otp', {
                    state: {
                        phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
                        mode: 'signup',
                        fullName: formData.fullName.trim()
                    }
                });
            }, 1500);
        }
    };

    return (
        <div className="auth-container">
            {/* Top Section */}
            <div className="auth-top-section">
                <div className="auth-header-top">
                    <img src={eXpensioLogo} alt="eXpensio Logo" className="auth-logo-top" />
                    <h1 className="auth-welcome-text">Create Account</h1>
                </div>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                className="auth-bottom-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                <h2 className="sheet-title">Sign up to get started</h2>

                <form className="auth-form" onSubmit={handleSignUp}>
                    {/* Full Name Input */}
                    <div className="input-group">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="auth-input"
                                required
                                minLength="2"
                                maxLength="50"
                                style={{ paddingLeft: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Phone Input with Country Selector */}
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
                        whileHover={{ scale: (formData.phoneNumber.length >= 10 && formData.fullName.trim()) ? 1.02 : 1 }}
                        whileTap={{ scale: (formData.phoneNumber.length >= 10 && formData.fullName.trim()) ? 0.98 : 1 }}
                        disabled={formData.phoneNumber.length < 10 || !formData.fullName.trim() || isLoading}
                    >
                        {isLoading ? '' : 'SIGN UP'}
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
