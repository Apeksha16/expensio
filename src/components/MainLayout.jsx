import { Outlet, NavLink } from 'react-router-dom';
import { Home, PieChart, Plus, Wallet, Settings } from 'lucide-react';
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
                    to="/stats"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <PieChart size={24} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/add"
                    className={({ isActive }) => `nav-item add-btn ${isActive ? 'active' : ''}`}
                >
                    <Plus size={28} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/history"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Wallet size={24} className="nav-icon" />
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Settings size={24} className="nav-icon" />
                </NavLink>
            </nav>
        </div>
    );
};

export default MainLayout;
