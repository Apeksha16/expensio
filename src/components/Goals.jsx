import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import './Goals.css';

const Goals = () => {
    const navigate = useNavigate();
    const { goals, addGoal, updateGoalSavings } = useTransactions();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // Form States
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

    const handleAddGoal = () => {
        if (!title || !targetAmount) return;
        addGoal({
            title,
            targetAmount: parseFloat(targetAmount),
            savedAmount: 0,
            targetDate
        });
        setShowAddModal(false);
        resetForm();
    };

    const handleDeposit = () => {
        if (!depositAmount || !selectedGoal) return;
        updateGoalSavings(selectedGoal.id, parseFloat(depositAmount));
        setShowDepositModal(false);
        setDepositAmount('');
        setSelectedGoal(null);
    };

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setTargetDate('');
    };

    return (
        <div className="goals-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">Savings Goals</span>
                <div style={{ width: 40 }}></div>
            </div>

            <div className="goals-list">
                {goals.map(goal => {
                    const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                    return (
                        <div key={goal.id} className="goal-card" onClick={() => {
                            setSelectedGoal(goal);
                            setShowDepositModal(true);
                        }}>
                            <div className="goal-icon">
                                <Target size={24} color="#4A70A9" />
                            </div>
                            <div className="goal-info">
                                <div className="goal-header">
                                    <span className="goal-title">{goal.title}</span>
                                    <span className="goal-target">${goal.targetAmount.toLocaleString()}</span>
                                </div>
                                <div className="goal-progress-container">
                                    <div className="goal-progress-bar" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="goal-meta">
                                    <span className="goal-saved">${goal.savedAmount.toLocaleString()} saved</span>
                                    <span className="goal-date">Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Goal FAB */}
            <div className="fab-container">
                <button className="fab-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={32} />
                </button>
            </div>

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-content"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                        >
                            <h3>New Value Goal</h3>
                            <input
                                className="modal-input"
                                placeholder="Goal Title (e.g. GoPro)"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                            <input
                                className="modal-input"
                                type="number"
                                placeholder="Target Amount"
                                value={targetAmount}
                                onChange={e => setTargetAmount(e.target.value)}
                            />
                            <input
                                className="modal-input"
                                type="date"
                                value={targetDate}
                                onChange={e => setTargetDate(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button className="modal-btn save" onClick={handleAddGoal}>Create Goal</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deposit Modal */}
            <AnimatePresence>
                {showDepositModal && selectedGoal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h3>Add Savings to {selectedGoal.title}</h3>
                            <div className="input-wrapper">
                                <span className="currency-prefix">$</span>
                                <input
                                    className="modal-input large"
                                    type="number"
                                    placeholder="0"
                                    value={depositAmount}
                                    onChange={e => setDepositAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={() => setShowDepositModal(false)}>Cancel</button>
                                <button className="modal-btn save" onClick={handleDeposit}>Deposit</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Goals;
