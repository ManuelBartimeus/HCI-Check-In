import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1c1c1c',
            color: '#ffffff',
            border: '1px solid #262626',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'Inter Variable, Inter, sans-serif',
            letterSpacing: '-0.14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#090909' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#090909' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
