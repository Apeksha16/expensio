import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Users, Search, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Groups.css';

const Groups = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([
        { id: '1', name: 'Apartment 404', members: 3, totalExpense: 1200 },
        { id: '2', name: 'Goa Trip', members: 5, totalExpense: 5400 },
    ]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now().toString(),
            name: newGroupName,
            members: 1, // Self
            totalExpense: 0
        };
        setGroups([newGroup, ...groups]);
        setNewGroupName('');
        setShowCreateModal(false);
    };

    return (
        <div className="groups-container">
            {/* Header */}
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="header-title">Groups</div>
                <button className="search-btn">
                    <Search size={22} />
                </button>
            </div>

            {/* Groups List */}
            <div className="groups-list">
                {groups.map(group => (
                    <div key={group.id} className="group-card" onClick={() => navigate(`/groups/${group.id}`)}>
                        <div className="group-icon">
                            <Users size={24} color="#4A70A9" />
                        </div>
                        <div className="group-info">
                            <span className="group-name">{group.name}</span>
                            <span className="group-meta">{group.members} members</span>
                        </div>
                        <div className="group-expense">
                            <span className="expense-label">Total Expense</span>
                            <span className="expense-amount">${group.totalExpense.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* FAB */}
            <div className="fab-container">
                <button className="fab-btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={32} />
                </button>
            </div>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-content"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                        >
                            <h3>Create New Group</h3>
                            <input
                                className="modal-input"
                                placeholder="Group Name (e.g. Vacation)"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button className="modal-btn save" onClick={handleCreateGroup}>Create</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Groups;
