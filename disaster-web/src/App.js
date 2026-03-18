import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import ResponderDashboard from './ResponderDashboard';
import CitizenDashboard from './CitizenDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/responder" element={<ResponderDashboard />} />
        <Route path="/citizen" element={<CitizenDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;