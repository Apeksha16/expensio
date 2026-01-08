import { motion } from 'framer-motion';
import { ChevronLeft, User, Bell, Shield, Moon, Monitor, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Account',
            items: [
                { icon: User, label: 'Profile Information', value: 'John Doe' },
                { icon: Bell, label: 'Notifications', value: 'On' },
                { icon: Shield, label: 'Security', value: '' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Moon, label: 'Dark Mode', value: 'System' },
                { icon: Monitor, label: 'Display Settings', value: '' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: HelpCircle, label: 'Help & Support', value: '' },
                { icon: HelpCircle, label: 'About eXpensio', value: 'v1.0.0' },
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <div className="settings-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">Settings</span>
                <div style={{ width: 40 }}></div>
            </div>

            <motion.div
                className="settings-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {sections.map((section, index) => (
                    <div key={index} className="settings-section">
                        <h3 className="section-header">{section.title}</h3>
                        <div className="section-items">
                            {section.items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="setting-item"
                                    variants={itemVariants}
                                >
                                    <div className="setting-icon-wrapper">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="setting-info">
                                        <span className="setting-label">{item.label}</span>
                                        {item.value && <span className="setting-value">{item.value}</span>}
                                    </div>
                                    <ChevronRight size={16} className="setting-arrow" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                <motion.button
                    className="logout-btn"
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Settings;
