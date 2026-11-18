import { StrictMode } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { createRoot } from 'react-dom/client';
// fonte servida pelo próprio site (funciona sem internet e não chama o Google)
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* só as animações básicas do Motion (sem o sistema de layout, que media todos os doces a cada mudança) */}
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
);
