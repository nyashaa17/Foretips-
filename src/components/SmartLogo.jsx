import { useState, useEffect } from 'react';
import { getPreviewUrl } from '../utils/image';

/**
 * SmartLogo component that handles multiple fallback URLs and error states.
 * @param {Object} props
 * @param {string[]} props.urls - Array of URLs to try in order.
 * @param {string} props.alt - Alt text for the image.
 * @param {string} props.className - CSS classes for the image.
 * @param {string} props.fallbackText - Text to show in placeholder if all URLs fail.
 */
export default function SmartLogo({ urls = [], alt = 'Logo', className = '', fallbackText = '?' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [validUrls, setValidUrls] = useState([]);

  useEffect(() => {
    // Filter out null/undefined/empty URLs
    const filtered = urls.filter(url => url && typeof url === 'string' && url.length > 0);
    
    // Implement retry once mechanism by appending a query parameter
    const withRetry = filtered.flatMap(url => [url, url.includes('?') ? `${url}&retry=1` : `${url}?retry=1`]);
    
    setValidUrls(withRetry);
    setCurrentIndex(0);
    setHasError(false);
  }, [JSON.stringify(urls)]);

  const handleError = () => {
    if (currentIndex < validUrls.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const currentUrl = validUrls[currentIndex];

  if (hasError || !currentUrl) {
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200`}>
        <span className="text-slate-400 font-bold text-sm">
          {fallbackText ? fallbackText.substring(0, 2).toUpperCase() : '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={getPreviewUrl(currentUrl)}
      alt={alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
}
