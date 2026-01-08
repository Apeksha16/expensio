
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import Onboarding from './components/Onboarding.jsx';
import Login from './components/Login.jsx';
import SignUp from './components/SignUp.jsx';
import OTPVerification from './components/OTPVerification.jsx';
import MainLayout from './components/MainLayout.jsx';
import Dashboard from './components/Dashboard.jsx';
import Stats from './components/Stats.jsx';
import AddTransaction from './components/AddTransaction.jsx';
import HistoryPage from './components/History.jsx';
import Settings from './components/Settings.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-otp" element={<OTPVerification />} />

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
