import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

// 1. Bootstrap CSS (You likely already have this)
import 'bootstrap/dist/css/bootstrap.min.css'; 

// 2. Bootstrap JS (THIS IS THE MISSING FIX FOR MOBILE MENU)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
        <App />
    </ThemeProvider>
  </React.StrictMode>
);