import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import eXpensioLogo from '../assets/logoOnboarding.png';
import './Splash.css';

const Splash = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/onboarding');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-container">
            <motion.div
                className="splash-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <div className="logo-box">
                    <motion.img
                        src={eXpensioLogo}
                        alt="eXpensio Logo"
                        className="splash-logo"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut"
                        }}
                    />
                </div>

                <motion.h1
                    className="splash-brand"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    eXpensio
                </motion.h1>
            </motion.div>
        </div>
    );
};

export default Splash;
