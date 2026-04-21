import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/global.css';
import { Popup } from './Popup';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root in popup');
createRoot(root).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
