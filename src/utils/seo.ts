// SEO constants and utilities for consistent SEO across the marketplace

export const SEO_CONFIG = {
  siteName: 'Sina.lk - Sri Lankan Marketplace',
  siteUrl: 'https://srilankanmarketplace.com', // Update with actual domain
  defaultDescription: 'Discover authentic Sri Lankan products, crafts, and services. Connect with local artisans, shop unique items, and support Sri Lankan businesses worldwide.',
  defaultKeywords: 'Sri Lankan products, Ceylon crafts, Sri Lankan marketplace, authentic Sri Lankan goods, local artisans, handmade crafts, Ceylon tea, Sri Lankan art, traditional crafts, online marketplace',
  twitterHandle: '@SLMarketplace', // Update with actual handle
  defaultImage: '/og-default.jpg',
  organization: {
    name: 'Sri Lankan Marketplace',
    url: 'https://srilankanmarketplace.com',
    logo: 'https://srilankanmarketplace.com/logo.png',
    sameAs: [
      'https://facebook.com/srilankanmarketplace',
      'https://instagram.com/srilankanmarketplace',
      'https://twitter.com/slmarketplace'
    ]
  }
};

// Generate structured data for organization
export const getOrganizationStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SEO_CONFIG.organization.name,
  url: SEO_CONFIG.organization.url,
  logo: SEO_CONFIG.organization.logo,
  sameAs: SEO_CONFIG.organization.sameAs,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+94-XXX-XXX-XXX', // Update with actual number
    contactType: 'Customer Service',
    availableLanguage: ['English', 'Sinhala', 'Tamil']
  }
});

// Generate structured data for marketplace/website
export const getWebsiteStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SEO_CONFIG.siteName,
  url: SEO_CONFIG.siteUrl,
  description: SEO_CONFIG.defaultDescription,
  publisher: getOrganizationStructuredData(),
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
});

// Generate structured data for products
export const getProductStructuredData = (product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  brand?: string;
  category?: string;
  condition?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  seller?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image,
  brand: product.brand || 'Sri Lankan Marketplace',
  category: product.category,
  offers: {
    '@type': 'Offer',
    price: product.price.toString(),
    priceCurrency: product.currency,
    availability: `https://schema.org/${product.availability || 'InStock'}`,
    condition: `https://schema.org/${product.condition || 'NewCondition'}`,
    seller: {
      '@type': 'Organization',
      name: product.seller || SEO_CONFIG.siteName
    }
  }
});

// Generate breadcrumb structured data
export const getBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((breadcrumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: breadcrumb.name,
    item: breadcrumb.url
  }))
});

// Generate FAQ structured data
export const getFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Generate article structured data
export const getArticleStructuredData = (article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  author: {
    '@type': 'Person',
    name: article.author
  },
  publisher: getOrganizationStructuredData(),
  datePublished: article.datePublished,
  dateModified: article.dateModified || article.datePublished,
  image: article.image || SEO_CONFIG.defaultImage,
  url: article.url
});

// Generate canonical URL
export const getCanonicalUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
};

// Generate page-specific keywords
export const generateKeywords = (baseKeywords: string[], additionalKeywords: string[] = []) => {
  const defaultKeywords = SEO_CONFIG.defaultKeywords.split(', ');
  return [...new Set([...baseKeywords, ...additionalKeywords, ...defaultKeywords])].join(', ');
};

// Generate meta title with proper formatting
export const generateTitle = (pageTitle: string, includesSiteName = false) => {
  if (includesSiteName || pageTitle.includes(SEO_CONFIG.siteName)) {
    return pageTitle;
  }
  return `${pageTitle} | ${SEO_CONFIG.siteName}`;
};
