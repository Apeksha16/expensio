import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, User, DollarSign, PieChart, Coins, TrendingUp, Wallet } from 'lucide-react';
import loginPageIllustration from '../assets/loginPageIllustration.png';
import eXpensioLogo from '../assets/logoOnboarding.png';
import './Login.css'; // Reusing Auth styles

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignUp = (e) => {
        e.preventDefault();
        // Here we would handle signup Logic / Sending OTP
        if (formData.phoneNumber.length >= 10 && formData.fullName) {
            navigate('/verify-otp', { state: { phoneNumber: formData.phoneNumber, mode: 'signup', fullName: formData.fullName } });
        }
    };

    const floatingIcons = [
        { Icon: DollarSign, delay: 0, x: '10%', y: '10%', size: 48, duration: 15 },
        { Icon: PieChart, delay: 2, x: '85%', y: '15%', size: 40, duration: 18 },
        { Icon: Coins, delay: 5, x: '10%', y: '80%', size: 36, duration: 20 },
        { Icon: TrendingUp, delay: 1, x: '85%', y: '75%', size: 44, duration: 16 },
        { Icon: Wallet, delay: 3, x: '45%', y: '20%', size: 32, duration: 22 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div className="auth-container">
            {/* Background Animations */}
            <div className="background-elements">
                {floatingIcons.map(({ Icon, delay, x, y, size, duration }, index) => (
                    <motion.div
                        key={index}
                        className="floating-icon"
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: [0.1, 0.2, 0.1],
                            y: [0, -20, 0],
                            x: [0, 10, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: delay
                        }}
                        style={{
                            left: x,
                            top: y,
                            position: 'absolute'
                        }}
                    >
                        <Icon size={size} color="var(--palette-primary)" opacity={0.2} />
                    </motion.div>
                ))}
            </div>

            {/* Wave Background */}
            <div className="orange-wave">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="var(--palette-secondary)" fillOpacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            {/* Bottom Illustration */}
            <motion.img
                src={loginPageIllustration}
                className="bottom-illustration signup-variant"
                initial={{ y: 200, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 1, type: "spring" }}
            />

            <div className="auth-content">
                <motion.div
                    className="auth-header"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <img src={eXpensioLogo} alt="Logo" className="auth-logo" />
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join eXpensio today</p>
                </motion.div>

                <motion.form
                    className="auth-form"
                    onSubmit={handleSignUp}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className="input-group" variants={itemVariants}>
                        <User className="input-icon" size={20} />
                        <motion.input
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="auth-input"
                            required
                            whileFocus={{ scale: 1.02 }}
                        />
                    </motion.div>

                    <motion.div className="input-group" variants={itemVariants}>
                        <Smartphone className="input-icon" size={20} />
                        <motion.input
                            type="tel"
                            name="phoneNumber"
                            placeholder="Phone Number"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="auth-input"
                            required
                            whileFocus={{ scale: 1.02 }}
                        />
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="primary-block-button"
                        variants={itemVariants}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        SIGN UP
                    </motion.button>
                </motion.form>

                <motion.div
                    className="auth-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
                </motion.div>
            </div>
        </div>
    );
};

export default SignUp;
