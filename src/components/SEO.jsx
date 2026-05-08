import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export default function SEO({ title, description, keywords, image, type = 'website', canonicalUrl }) {
  const location = useLocation();
  const siteName = 'Foretips';
  const fullTitle = title 
    ? (title.toLowerCase().includes(siteName.toLowerCase()) ? title : `${title} | ${siteName}`) 
    : `${siteName} | AI-Powered Football Predictions & Match Analysis`;
  const url = canonicalUrl || `https://foretips.co.zw${location.pathname}`;

  const defaultImage = 'https://qyebxlyciijxdwapvyiy.supabase.co/storage/v1/object/public/Assets/og.jpg';
  const finalImage = image || defaultImage;
  const isJpg = finalImage.endsWith('.jpg') || finalImage.endsWith('.jpeg');
  const imageType = isJpg ? 'image/jpeg' : 'image/png';

  const finalDescription = description || 'Get daily AI-powered football tips, advanced match analysis, and data-driven insights to help you make smarter betting decisions.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:type" content={imageType} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
}
