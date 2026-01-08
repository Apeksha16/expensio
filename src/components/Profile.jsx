import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, User, CreditCard, Shield, Settings, LogOut, Mail, Award } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const user = {
        name: 'Apeksha Verma',
        email: 'apeksha@example.com',
        joinDate: 'January 2026',
        balance: 2821.00
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="profile-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{ width: 40 }}></div>
            </div>

            <motion.div
                className="profile-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Profile Header */}
                <motion.div className="profile-card" variants={itemVariants}>
                    <div className="profile-avatar">
                        <User size={40} color="#4A70A9" />
                    </div>
                    <h2 className="profile-name">{user.name}</h2>
                    <p className="profile-email">{user.email}</p>
                    <div className="profile-badge">
                        <Award size={14} />
                        <span>Premium Member</span>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <motion.div className="profile-stats" variants={itemVariants}>
                    <div className="p-stat-item">
                        <span className="p-stat-val">$2.8k</span>
                        <span className="p-stat-label">Saved</span>
                    </div>
                    <div className="p-stat-divider"></div>
                    <div className="p-stat-item">
                        <span className="p-stat-val">12</span>
                        <span className="p-stat-label">Goals</span>
                    </div>
                    <div className="p-stat-divider"></div>
                    <div className="p-stat-item">
                        <span className="p-stat-val">4.9</span>
                        <span className="p-stat-label">Rating</span>
                    </div>
                </motion.div>

                {/* Settings List */}
                <motion.div className="settings-section" variants={itemVariants}>
                    <div className="section-label">Account</div>
                    <div className="settings-list">
                        <div className="setting-item" onClick={() => navigate('/settings')}>
                            <div className="setting-icon">
                                <User size={20} />
                            </div>
                            <span>Personal Information</span>
                        </div>
                        <div className="setting-item">
                            <div className="setting-icon">
                                <CreditCard size={20} />
                            </div>
                            <span>Payment Methods</span>
                        </div>
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Shield size={20} />
                            </div>
                            <span>Privacy & Security</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="settings-section" variants={itemVariants}>
                    <div className="section-label">General</div>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Settings size={20} />
                            </div>
                            <span>App Preferences</span>
                        </div>
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Mail size={20} />
                            </div>
                            <span>Help & Support</span>
                        </div>
                        <div className="setting-item logout">
                            <div className="setting-icon logout">
                                <LogOut size={20} />
                            </div>
                            <span>Log Out</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Profile;
