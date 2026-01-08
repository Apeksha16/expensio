import { useState, useMemo } from 'react';
import { ChevronLeft, Search, Filter, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const { transactions } = useTransactions();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'

    // Export Function
    const handleExport = () => {
        if (transactions.length === 0) return;

        const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Payment Mode', 'Note'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(tx => [
                tx.date,
                `"${tx.title}"`,
                tx.category,
                tx.type,
                tx.amount,
                tx.paymentMode || 'Cash',
                `"${tx.note || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `expensio_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Derived state for filtering and grouping
    const processedTransactions = useMemo(() => {
        let filtered = transactions.filter(tx => {
            const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = filterType === 'all' || tx.type === filterType;
            return matchesSearch && matchesType;
        });

        // Group by Date
        const groups = filtered.reduce((acc, tx) => {
            const dateObj = new Date(tx.date);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            if (dateObj.toDateString() === today.toDateString()) dateLabel = 'Today';
            else if (dateObj.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';

            if (!acc[dateLabel]) acc[dateLabel] = [];
            acc[dateLabel].push(tx);
            return acc;
        }, {});

        // Sort groups by date (descending) is tricky with string labels, 
        // so we might need to sort keys based on original timestamps or just rely on transaction order if they are already sorted.
        // Assuming transactions are sorted new->old.
        return groups;
    }, [transactions, searchTerm, filterType]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="history-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="search-bar">
                    <Search size={18} color="#9CA3AF" />
                    <input
                        type="text"
                        placeholder="Search entries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="export-btn" onClick={handleExport} aria-label="Export CSV">
                    <Download size={20} color="#4A70A9" />
                </button>
            </div>

            <div className="filter-tabs">
                {['all', 'income', 'expense'].map(type => (
                    <button
                        key={type}
                        className={`filter-tab ${filterType === type ? 'active' : ''}`}
                        onClick={() => setFilterType(type)}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            <motion.div
                className="history-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {Object.keys(processedTransactions).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Calendar size={48} />
                        </div>
                        <p>No transactions found</p>
                    </div>
                ) : (
                    Object.entries(processedTransactions).map(([dateLabel, txs]) => (
                        <div key={dateLabel} className="history-group">
                            <div className="group-header">{dateLabel}</div>
                            {txs.map(tx => {
                                const Icon = getIcon(tx.category);
                                return (
                                    <motion.div key={tx.id} className="history-item" variants={itemVariants}>
                                        <div className="history-icon-wrapper">
                                            <Icon size={20} />
                                        </div>
                                        <div className="history-info">
                                            <div className="history-main">
                                                <span className="history-title">{tx.title}</span>
                                                <span className={`history-amount ${tx.type}`}>
                                                    {tx.type === 'income' ? '+' : '-'}${tx.amount}
                                                </span>
                                            </div>
                                            <div className="history-sub">
                                                <span className="history-cat">{tx.category}</span>
                                                <span className="history-dot">•</span>
                                                <span className="history-mode">{tx.paymentMode || 'Cash'}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))
                )}
            </motion.div>
        </div>
    );
};

export default History;
