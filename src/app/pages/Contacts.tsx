import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Instagram, Send, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { findCmsPage, type CmsBlock } from '../cms/content';
import { useCmsContent } from '../cms/useCmsContent';
import { submitContact } from '../api/client';

interface ContactItem {
  icon: LucideIcon;
  title: string;
  content: string;
  link: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  instagram: Instagram,
  'map-pin': MapPin,
  clock: Clock
};

const fallbackContactInfo: ContactItem[] = [
  { icon: Phone, title: 'Телефон', content: '+7 (495) 123-45-67', link: 'tel:+74951234567' },
  { icon: Mail, title: 'Email', content: 'info@saraflowers.ru', link: 'mailto:info@saraflowers.ru' },
  { icon: Instagram, title: 'Instagram', content: '@sara_flowers', link: 'https://instagram.com' },
  { icon: MapPin, title: 'Адрес', content: 'Москва, ул. Цветочная, д. 15', link: null }
];

function findTextBlock(blocks: CmsBlock[], title: string): CmsBlock | undefined {
  return blocks.find(
    (block) =>
      block.type === 'text' &&
      typeof block.title === 'string' &&
      block.title.trim().toLowerCase() === title.toLowerCase()
  );
}

function readSectionTitle(blocks: CmsBlock[]): string {
  const block = blocks.find((item) => item.type === 'sectionTitle' && typeof item.text === 'string' && item.text.trim());
  return typeof block?.text === 'string' && block.text.trim() ? block.text : 'Контакты';
}

function readSubtitle(blocks: CmsBlock[]): string {
  const block = findTextBlock(blocks, 'subtitle');
  return typeof block?.body === 'string' && block.body.trim()
    ? block.body
    : 'Свяжитесь с нами любым удобным способом. Мы всегда рады помочь!';
}

function readContacts(blocks: CmsBlock[]): ContactItem[] {
  const block = blocks.find(
    (item) =>
      item.type === 'products' &&
      typeof item.title === 'string' &&
      item.title.trim().toLowerCase() === 'contact-items'
  );
  if (!block || !Array.isArray(block.items)) return [];

  return block.items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.name === 'string' ? record.name.trim() : '';
      const content = typeof record.price === 'string' ? record.price.trim() : '';
      if (!title || !content) return null;

      const iconKey = typeof record.meta === 'string' ? record.meta.trim().toLowerCase() : '';
      const link = typeof record.description === 'string' && record.description.trim() ? record.description : null;

      return {
        icon: iconMap[iconKey] ?? Mail,
        title,
        content,
        link
      } satisfies ContactItem;
    })
    .filter((item): item is ContactItem => item !== null);
}

export function Contacts() {
  const cmsContent = useCmsContent();
  const cmsPage = findCmsPage(cmsContent, 'contacts');
  const blocks = cmsPage?.blocks ?? [];

  const pageTitle = readSectionTitle(blocks);
  const pageSubtitle = readSubtitle(blocks);
  const workHoursBlock = findTextBlock(blocks, 'Режим работы');
  const formBlock = findTextBlock(blocks, 'Форма');
  const workHours = typeof workHoursBlock?.body === 'string' && workHoursBlock.body.trim() ? workHoursBlock.body : 'Ежедневно с 9:00 до 21:00';
  const formButtonText = typeof formBlock?.body === 'string' && formBlock.body.trim() ? formBlock.body : 'Отправить сообщение';
  const cmsContacts = readContacts(blocks);
  const contactInfo = cmsContacts.length > 0 ? cmsContacts : fallbackContactInfo;

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await submitContact(formData);
      alert('Спасибо! Заявка отправлена, менеджер скоро свяжется с вами.');
      setFormData({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось отправить форму';
      alert(`Ошибка отправки: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-60 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-light italic mb-6" style={{ fontFamily: 'var(--font-script)' }}>{pageTitle}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
            {pageSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200">
              <h2 className="text-3xl font-light italic mb-8" style={{ fontFamily: 'var(--font-script)' }}>Наши контакты</h2>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={`${info.title}-${index}`} className="flex items-start gap-4">
                    <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{info.title}</p>
                      {info.link ? (
                        <a href={info.link} target={info.link.startsWith('http') ? '_blank' : undefined} rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-lg font-medium hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-lg font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{info.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Режим работы</p>
                    <p className="text-lg font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{workHours}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200">
              <h2 className="text-3xl font-light italic mb-8" style={{ fontFamily: 'var(--font-script)' }}>Напишите нам</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Ваше имя</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors bg-white/50" style={{ fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Телефон</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 (___) ___-__-__" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors bg-white/50" style={{ fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors bg-white/50" style={{ fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Сообщение</label>
                  <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors bg-white/50 resize-none" style={{ fontFamily: 'var(--font-sans)' }} />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-4 rounded-xl hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Отправляем...' : formButtonText}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border border-gray-200 overflow-hidden">
          <div className="w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center" />
        </motion.div>
      </div>
    </div>
  );
}


