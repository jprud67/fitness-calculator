import { StrictMode, Suspense } from 'react'; // Import Suspense
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // Initialize i18next

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Wrap App with Suspense for loading translations */}
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  </StrictMode>,
);
