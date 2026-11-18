import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// fonte servida pelo próprio site (funciona sem internet e não chama o Google)
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
