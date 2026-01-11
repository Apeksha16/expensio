import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logoOnboarding.png';
import vector1 from '../assets/vector1.png';
import vector2 from '../assets/vector2.png';
import vector3 from '../assets/vector3.png';

import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

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
            navigate('/login');
        }
    };

    return (
        <div className="onboarding-container">
            {/* Header */}
            <header className="onboarding-header">
                <img src={logo} alt="Logo" className="header-logo" />
                <span className="brand-name">eXpensio</span>
            </header>

            <button className="skip-btn" onClick={() => navigate('/login')}>Skip</button>

            {/* Main Content */}
            <div className="onboarding-content">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide}
                        className="slide-container"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="image-wrapper">
                            <img
                                src={slides[currentSlide].image}
                                alt={slides[currentSlide].title}
                                className="slide-image"
                            />
                        </div>

                        <div className="text-content">
                            <h2 className="slide-title">{slides[currentSlide].title}</h2>
                            <p className="slide-subtitle">{slides[currentSlide].subtitle}</p>
                        </div>

                        {/* Pagination Dots */}
                        <div className="dots-container">
                            {slides.map((_, index) => (
                                <motion.div
                                    key={index}
                                    className={`dot ${currentSlide === index ? 'active' : ''}`}
                                    animate={{
                                        width: currentSlide === index ? 24 : 8,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="action-area">
                            <button className="action-btn" onClick={handleNext}>
                                {currentSlide === slides.length - 1 ? "GO" : <ArrowRight size={28} />}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
