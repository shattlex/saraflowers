import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const COOKIES_ACCEPTED_KEY = 'sf_cookies_accepted_v1';

export function CookiesBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accepted = window.localStorage.getItem(COOKIES_ACCEPTED_KEY);
    setIsVisible(accepted !== '1');
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(COOKIES_ACCEPTED_KEY, '1');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-xl rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-sans)' }}>
          Мы используем cookies для работы сайта, аналитики и улучшения сервиса. Продолжая использовать сайт,
          вы соглашаетесь с{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Политикой конфиденциальности
          </Link>
          .
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
