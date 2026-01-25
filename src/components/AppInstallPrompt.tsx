import React, { useEffect, useState } from 'react';

// Componente para mostrar el banner de instalación de la PWA en Android
const AppInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <span>¿Quieres instalar esta app en tu dispositivo?</span>
        <button
          onClick={handleInstallClick}
          style={{
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Instalar
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          style={{
            background: 'transparent',
            color: '#888',
            border: 'none',
            marginLeft: 8,
            cursor: 'pointer',
          }}
        >
          No, gracias
        </button>
      </div>
    </div>
  );
};

export default AppInstallPrompt;
