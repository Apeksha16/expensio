import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, DollarSign, PieChart, Coins, TrendingUp, Wallet } from 'lucide-react';
import logo from '../assets/logoOnboarding.png';
// User Assets
import vector1 from '../assets/vector1.png';
import vector2 from '../assets/vector2.png';
import vector3 from '../assets/vector3.png';

import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // ... existing slides ...
    const slides = [
        {
            id: 1,
            image: vector1,
            title: "Control Your Money",
            subtitle: "Effortlessly track every penny and take charge of your financial tracking journey.",
        },
        {
            id: 2,
            image: vector2,
            title: "Smart Analytics",
            subtitle: "Gain powerful insights into your spending habits with our intuitive glass displays.",
        },
        {
            id: 3,
            image: vector3,
            title: "Reach Your Goals",
            subtitle: "Set targets, save more, and watch your wealth take off to new heights.",
        },
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            navigate('/home');
        }
    };

    const floatingIcons = [
        { Icon: DollarSign, delay: 0, x: '10%', y: '85%', size: 48, duration: 15 },
        { Icon: PieChart, delay: 2, x: '85%', y: '20%', size: 40, duration: 18 },
        { Icon: Coins, delay: 5, x: '15%', y: '40%', size: 36, duration: 20 },
        { Icon: TrendingUp, delay: 1, x: '75%', y: '60%', size: 44, duration: 16 },
        { Icon: Wallet, delay: 3, x: '40%', y: '10%', size: 32, duration: 22 },
    ];

    return (
        <div className="onboarding-container">
            {/* Background Animations */}
            <div className="background-elements">
                {floatingIcons.map(({ Icon, delay, x, y, size, duration }, index) => (
                    <motion.div
                        key={index}
                        className="floating-icon"
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                            y: [0, -40, 0],
                            x: [0, 20, 0],
                            rotate: [0, 10, -10, 0]
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
                        <Icon size={size} color="var(--brand-primary)" opacity={0.3} />
                    </motion.div>
                ))}
            </div>
            {/* Header */}
            <header className="onboarding-header">
                <img src={logo} alt="Logo" className="header-logo" />
                <span className="brand-name">eXpensio</span>
            </header>

            {/* Orange Wave Background - Adjusted to be lower */}
            <div className="orange-wave">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                        fill="var(--palette-secondary)"
                        fillOpacity="0.4"
                        animate={{
                            d: currentSlide === 0
                                ? [
                                    "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,160C960,139,1056,149,1152,160C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                                    "M0,180L48,185C96,192,192,210,288,215C384,220,480,240,576,230C672,220,768,170,864,150C960,130,1056,140,1152,150C1248,160,1344,170,1392,175L1440,180L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                                    "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,160C960,139,1056,149,1152,160C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                ]
                                : currentSlide === 1
                                    ? "M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                    : "M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        }}
                        transition={{
                            duration: currentSlide === 0 ? 4 : 0.8, // Slower duration for the breathing loop
                            repeat: currentSlide === 0 ? Infinity : 0,
                            ease: "easeInOut"
                        }}
                    />
                </svg>
            </div>

            {/* Main Content Centered */}
            <div className="onboarding-content">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide}
                        className="slide-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="image-wrapper">
                            <motion.img
                                src={slides[currentSlide].image}
                                alt={slides[currentSlide].title}
                                className="slide-image"
                            />
                        </div>

                        <div className="spacer-flex" />

                        <div className="text-content">
                            <motion.h2
                                className="slide-title"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {slides[currentSlide].title}
                            </motion.h2>
                            <motion.p
                                className="slide-subtitle"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {slides[currentSlide].subtitle}
                            </motion.p>
                        </div>

                        {/* Pagination Dots */}
                        <div className="dots-container">
                            {slides.map((_, index) => (
                                <motion.div
                                    key={index}
                                    className={`dot ${currentSlide === index ? 'active' : ''}`}
                                    initial={false}
                                    animate={{
                                        width: currentSlide === index ? 24 : 12,
                                        backgroundColor: currentSlide === index ? "var(--palette-primary)" : "rgba(0,0,0,0.2)"
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            ))}
                        </div>

                        <div className="action-area">
                            <button className="action-btn" onClick={handleNext}>
                                {currentSlide === slides.length - 1 ? "GO" : <ArrowRight size={28} color="white" />}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
