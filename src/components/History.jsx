import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const { transactions } = useTransactions();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <div className="history-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">Entries</span>
                <div style={{ width: 40 }}></div>
            </div>

            <div className="section-header">
                <span className="section-title">Latest Entries</span>
            </div>

            <motion.div
                className="history-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                        No transactions yet.
                    </div>
                ) : (
                    transactions.map((tx) => {
                        const Icon = getIcon(tx.category);
                        return (
                            <motion.div key={tx.id} className="history-item" variants={itemVariants}>
                                <div className="history-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={24} />
                                </div>
                                <div className="history-details">
                                    <div className="history-title">{tx.title}</div>
                                    <div className="history-meta">{tx.date}</div>
                                </div>
                                <div>
                                    <div className={`history-amount ${tx.type}`}>
                                        {tx.type === 'expense' ? '-' : '+'}${tx.amount}
                                    </div>
                                    <span className="history-sub">
                                        {tx.category}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
};

export default History;
