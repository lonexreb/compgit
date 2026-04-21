import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/global.css';
import { SidePanel } from './SidePanel';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root in sidepanel');
createRoot(root).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>,
);
