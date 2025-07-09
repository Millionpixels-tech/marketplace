import { Helmet } from 'react-helmet-async';

interface AdvancedSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  structuredData?: object | object[];
  noIndex?: boolean;
  alternateUrls?: Array<{ hreflang: string; href: string }>;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  articleSection?: string;
  articleTags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  category?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  author?: string;
  priority?: 'high' | 'medium' | 'low';
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const AdvancedSEOHead: React.FC<AdvancedSEOProps> = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = 'website',
  structuredData,
  noIndex = false,
  alternateUrls,
  robots,
  publishedTime,
  modifiedTime,
  articleSection,
  articleTags = [],
  price,
  availability,
  brand,
  category,
  breadcrumbs,
  author,
  priority = 'medium',
  changeFreq = 'weekly'
}) => {
  const siteName = 'Sina.lk';
  const siteUrl = 'https://sina.lk';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const currentUrl = canonicalUrl || window.location.href;
  
  // Enhanced image handling with multiple sizes
  const defaultOgImage = '/logo.svg';
  const imageToUse = ogImage || defaultOgImage;
  const fullImageUrl = imageToUse.startsWith('http') ? imageToUse : `${siteUrl}${imageToUse}`;

  // Generate advanced keywords
  const baseKeywords = [
    'Sri Lankan marketplace',
    'authentic Sri Lankan products',
    'handmade crafts Sri Lanka',
    'Ceylon tea',
    'Sri Lankan artisans'
  ];
  const allKeywords = [...new Set([...keywords, ...baseKeywords])];

  // Enhanced robots directive
  const robotsContent = robots || (noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');

  // Generate breadcrumb JSON-LD
  const breadcrumbSchema = breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  } : null;

  // Combine all structured data
  const allStructuredData = [];
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      allStructuredData.push(...structuredData);
    } else {
      allStructuredData.push(structuredData);
    }
  }
  if (breadcrumbSchema) {
    allStructuredData.push(breadcrumbSchema);
  }

  return (
    <Helmet>
      {/* Enhanced Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {allKeywords.length > 0 && <meta name="keywords" content={allKeywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Enhanced Robots */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      
      {/* Priority and Change Frequency for Sitemaps */}
      <meta name="priority" content={priority === 'high' ? '1.0' : priority === 'medium' ? '0.8' : '0.6'} />
      <meta name="changefreq" content={changeFreq} />
      
      {/* Enhanced Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={`${title} - ${siteName}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="si_LK" />
      <meta property="og:locale:alternate" content="ta_LK" />
      
      {/* Article specific Open Graph */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {articleSection && <meta property="article:section" content={articleSection} />}
      {articleTags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Product specific Open Graph */}
      {price && (
        <>
          <meta property="product:price:amount" content={price.amount.toString()} />
          <meta property="product:price:currency" content={price.currency} />
        </>
      )}
      {availability && <meta property="product:availability" content={availability} />}
      {brand && <meta property="product:brand" content={brand} />}
      {category && <meta property="product:category" content={category} />}
      
      {/* Enhanced Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={`${title} - ${siteName}`} />
      <meta name="twitter:site" content="@SinaLK" />
      <meta name="twitter:creator" content="@SinaLK" />
      
      {/* Enhanced Meta Tags for Search Engines */}
      <meta name="application-name" content={siteName} />
      <meta name="msapplication-TileColor" content="#72b01d" />
      <meta name="theme-color" content="#72b01d" />
      <meta httpEquiv="Content-Language" content="en-LK" />
      <meta name="geo.region" content="LK" />
      <meta name="geo.placename" content="Sri Lanka" />
      <meta name="geo.position" content="7.8731;80.7718" />
      <meta name="ICBM" content="7.8731, 80.7718" />
      
      {/* Language Alternatives */}
      <link rel="alternate" hrefLang="en" href={currentUrl} />
      <link rel="alternate" hrefLang="si" href={`${currentUrl}?lang=si`} />
      <link rel="alternate" hrefLang="ta" href={`${currentUrl}?lang=ta`} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />
      
      {/* Custom Alternate URLs */}
      {alternateUrls?.map((alt, index) => (
        <link key={index} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://firebaseapp.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//google-analytics.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//ssl.google-analytics.com" />
      
      {/* Structured Data */}
      {allStructuredData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(allStructuredData.length === 1 ? allStructuredData[0] : { '@graph': allStructuredData }, null, 0)}
        </script>
      )}
      
      {/* Additional Meta for Mobile */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      
      {/* Verification Tags */}
      <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
      <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
      <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" />
      
      {/* Security */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;" />
    </Helmet>
  );
};

export default AdvancedSEOHead;
