import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureAmplify } from './config/amplify';
import './i18n';

// Initialize AWS Amplify before rendering
configureAmplify();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
