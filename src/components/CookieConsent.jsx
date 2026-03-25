import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 flex items-center justify-between gap-4 shadow-lg border-t border-slate-800">
      <p className="text-sm">
        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
      </p>
      <button
        onClick={accept}
        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors whitespace-nowrap"
      >
        Accept
      </button>
    </div>
  );
}
