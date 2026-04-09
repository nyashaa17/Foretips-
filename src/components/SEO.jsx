import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ title, description, keywords, image, type = 'website' }) {
  const location = useLocation();
  const siteName = 'Foretips';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Data-Driven Football Predictions`;
  const url = `https://foretips.com${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || 'Advanced football match analysis and data-driven insights to help you make smarter bets.');
    }

    // Update or create meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description || 'Advanced football match analysis and data-driven insights.');

    const defaultImage = 'https://qyebxlyciijxdwapvyiy.supabase.co/storage/v1/object/public/Assets/og.webp';
    const finalImage = image || defaultImage;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', finalImage);

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', description || 'Advanced football match analysis and data-driven insights.');

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', finalImage);

  }, [fullTitle, description, url, image]);

  return null;
}
