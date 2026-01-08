import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { getBalance } = useTransactions();
    const [timeFilter, setTimeFilter] = useState('month'); // 'week' | 'month' | '3month'

    // Scroll tracking state for filters
    const [scrollStates, setScrollStates] = useState({
        left: false,
        right: false
    });

    const filterRef = useRef(null);

    const updateScrollState = () => {
        if (filterRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = filterRef.current;
            setScrollStates({
                left: scrollLeft > 10,
                right: scrollLeft + clientWidth < scrollWidth - 10
            });
        }
    };

    useEffect(() => {
        const fRef = filterRef.current;
        if (fRef) {
            fRef.addEventListener('scroll', updateScrollState);
            updateScrollState();
        }
        window.addEventListener('resize', updateScrollState);

        return () => {
            if (fRef) fRef.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, []);

    const balance = getBalance();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dash-header">
                <div className="user-text">
                    <span className="greeting">Good Morning,</span>
                    <h1 className="username">Apeksha Verma</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="notification-btn" onClick={() => navigate('/groups')}>
                        <Users size={24} color="#64748B" />
                    </div>
                    <div className="notification-btn">
                        <Bell size={24} color="#64748B" />
                        <div className="badge"></div>
                    </div>
                </div>
            </header>

            <motion.div
                className="main-content-dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Total Balance Hero Card */}
                <motion.div className="hero-card" variants={itemVariants}>
                    <div className="card-content">
                        <span className="balance-label">Total Balance</span>
                        <h2 className="balance-amount">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                        <div className="card-wave"></div>
                    </div>
                </motion.div>

                {/* Simplified Time Filter Toggle with Dynamic Scroll Fades */}
                <motion.div variants={itemVariants} className="filter-section">
                    <div className={`scroll-wrapper ${scrollStates.left ? 'can-scroll-left' : ''} ${scrollStates.right ? 'can-scroll-right' : ''}`}>
                        <div className="time-filter-row" ref={filterRef}>
                            {[
                                { id: 'week', label: 'This Week' },
                                { id: 'month', label: 'This Month' },
                                { id: '3month', label: '3 Month' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    className={`time-filter-btn ${timeFilter === filter.id ? 'active' : ''}`}
                                    onClick={() => setTimeFilter(filter.id)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
