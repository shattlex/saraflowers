import { useEffect, useState } from 'react';
import { CmsContent, loadCmsContent, CMS_STORAGE_KEY } from './content';

export function useCmsContent(): CmsContent {
  const [content, setContent] = useState<CmsContent>(() => loadCmsContent());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== CMS_STORAGE_KEY) return;
      setContent(loadCmsContent());
    };

    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(() => {
      setContent(loadCmsContent());
    }, 2000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, []);

  return content;
}
