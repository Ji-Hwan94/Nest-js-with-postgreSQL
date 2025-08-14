import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import BoardList from './components/Board/BoardList';
import BoardDetail from './components/Board/BoardDetail';
import BoardCreate from './components/Board/BoardCreate';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/boards" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/boards" element={
              <ProtectedRoute>
                <BoardList />
              </ProtectedRoute>
            } />
            <Route path="/boards/create" element={
              <ProtectedRoute>
                <BoardCreate />
              </ProtectedRoute>
            } />
            <Route path="/boards/:id" element={
              <ProtectedRoute>
                <BoardDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
