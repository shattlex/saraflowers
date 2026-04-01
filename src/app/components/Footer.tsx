import { Mail } from 'lucide-react';
import { Link } from 'react-router';
import { useCmsContent } from '../cms/useCmsContent';
import { LEGAL_DOCUMENTS } from '../legal/legalDocuments';

export function Footer() {
  const cmsContent = useCmsContent();
  const siteName = cmsContent.siteName?.trim() || 'Sara Flowers';

  return (
    <footer className="bg-gray-50 border-t border-gray-200" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-3xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
              {siteName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Свежие цветы, авторские композиции и бережная доставка по Москве и области.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Каталог</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/catalog" className="hover:text-primary transition-colors">Букеты</Link></li>
              <li><Link to="/bouquet-builder" className="hover:text-primary transition-colors">Конструктор</Link></li>
              <li><Link to="/delivery" className="hover:text-primary transition-colors">Доставка</Link></li>
              <li><Link to="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Документы</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {LEGAL_DOCUMENTS.map((doc) => (
                <li key={doc.route}>
                  <Link to={doc.route} className="hover:text-primary transition-colors">
                    {doc.footerLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Контакты</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:sales@sara-flowers.ru" className="hover:text-primary transition-colors">sales@sara-flowers.ru</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>&copy; 2026 {siteName}. Все права защищены.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

