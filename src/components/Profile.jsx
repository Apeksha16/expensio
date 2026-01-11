import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Edit3, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Shield, 
  LogOut, 
  Trash2,
  ChevronRight
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: 'Danny',
    email: 'danny@example.com',
    phone: '+91 98765 43210',
    birthday: '09/20/2000',
    gender: 'Male',
    profilePhoto: null
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleNameEdit = () => {
    if (isEditingName) {
      setUser({ ...user, name: tempName });
      setIsEditingName(false);
    } else {
      setTempName(user.name);
      setIsEditingName(true);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUser({ ...user, profilePhoto: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    // Add delete account logic here
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      navigate('/login');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button className="back-button" onClick={handleBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className="profile-title">About You</h1>
      </motion.div>

      <motion.div 
        className="profile-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Photo & Name Section */}
        <motion.div className="profile-card" variants={itemVariants}>
          <div className="profile-photo-section">
            <div className="profile-photo-container">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  <Users size={40} color="var(--brand-primary)" />
                </div>
              )}
              <label className="photo-edit-button" htmlFor="photo-upload">
                <Camera size={16} />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className="name-section">
              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="name-input"
                  autoFocus
                  onBlur={handleNameEdit}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameEdit()}
                />
              ) : (
                <h2 className="profile-name">{user.name}</h2>
              )}
              <button className="edit-name-button" onClick={handleNameEdit}>
                <Edit3 size={16} />
                <span>Edit your name</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Personal Information Section */}
        <motion.div className="info-section" variants={itemVariants}>
          <h3 className="section-title">Personal Information</h3>
          
          <div className="info-item">
            <div className="info-icon">
              <Phone size={20} color="var(--brand-primary)" />
            </div>
            <div className="info-content">
              <span className="info-label">Mobile Number</span>
              <span className="info-value">{user.phone}</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </div>

          <div className="info-item">
            <div className="info-icon">
              <Mail size={20} color="var(--brand-primary)" />
            </div>
            <div className="info-content">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </div>

          <div className="info-item">
            <div className="info-icon">
              <Calendar size={20} color="var(--brand-primary)" />
            </div>
            <div className="info-content">
              <span className="info-label">Birthday</span>
              <span className="info-value">{user.birthday}</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </div>

          <div className="info-item">
            <div className="info-icon">
              <Users size={20} color="var(--brand-primary)" />
            </div>
            <div className="info-content">
              <span className="info-label">Gender</span>
              <span className="info-value">{user.gender}</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div className="security-section" variants={itemVariants}>
          <h3 className="section-title">Security</h3>
          
          <div className="security-item">
            <div className="info-icon">
              <Shield size={20} color="var(--brand-primary)" />
            </div>
            <div className="info-content">
              <span className="info-label">Device Lock - Face ID</span>
              <span className="info-subtitle">
                {faceIdEnabled ? 'Enabled' : 'Set up Face ID for secure access'}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={faceIdEnabled}
                onChange={(e) => setFaceIdEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </motion.div>

        {/* Account Actions Section */}
        <motion.div className="actions-section" variants={itemVariants}>
          <button className="action-button logout-button" onClick={handleLogout}>
            <div className="info-icon">
              <LogOut size={20} color="var(--brand-primary)" />
            </div>
            <span>Logout</span>
            <ChevronRight size={16} className="chevron" />
          </button>

          <button className="action-button delete-button" onClick={handleDeleteAccount}>
            <div className="info-icon">
              <Trash2 size={20} color="#dc3545" />
            </div>
            <span>Delete Account</span>
            <ChevronRight size={16} className="chevron" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;