import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/global.css';
import { Options } from './Options';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root in options');
createRoot(root).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
