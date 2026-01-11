import { Outlet, NavLink } from 'react-router-dom';
import { Home, CreditCard, Plus, Calendar, User } from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
    return (
        <div className="main-layout">
            <div className="main-content">
                <Outlet />
            </div>

            <nav className="bottom-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Home size={24} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/history"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <CreditCard size={24} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/add"
                    className={({ isActive }) => `nav-item add-btn ${isActive ? 'active' : ''}`}
                >
                    <Plus size={28} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/stats"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Calendar size={24} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/profile"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <User size={24} className="nav-icon" />
                </NavLink>
            </nav>
        </div>
    );
};

export default MainLayout;
