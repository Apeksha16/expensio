
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import Onboarding from './components/Onboarding.jsx';
import Login from './components/Login.jsx';
import SignUp from './components/SignUp.jsx';
import OTPVerification from './components/OTPVerification.jsx';
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
