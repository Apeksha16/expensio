import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import './App.css';
import app from './firebaseConfig';

function Home() {
  const [count, setCount] = useState(0);
  // Simple check to ensure firebase is initialized
  console.log("Firebase App Initialized:", app.name);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Expensio</h1>
        <p>Your Mobile Expense Tracker</p>
      </header>
      <main className="app-content">
        <div className="card">
          <h2>Balance</h2>
          <p className="amount">$1,250.00</p>
        </div>

        <div className="actions">
          <button onClick={() => setCount((count) => count + 1)}>
            Add Expense ({count})
          </button>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
