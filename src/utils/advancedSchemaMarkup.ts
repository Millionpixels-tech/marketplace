/**
 * Advanced SEO Schema Generator for Top Search Rankings
 * Comprehensive schema markup for maximum search visibility
 */

// FAQ Schema for informational pages
export interface FAQ {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQ[]): object {
  return {
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
  };
}

// How-to Schema for guides and tutorials
export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export function generateHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string,
  estimatedCost?: { currency: string; value: string }
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url
    }))
  };

  if (totalTime) {
    schema.totalTime = totalTime;
  }

  if (estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: estimatedCost.currency,
      value: estimatedCost.value
    };
  }

  return schema;
}

// Enhanced Local Business Schema
export interface LocalBusinessData {
  name: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone: string;
  email: string;
  website: string;
  openingHours: string[];
  priceRange: string;
  paymentAccepted: string[];
  currenciesAccepted: string[];
  areaServed: string[];
  serviceArea?: string;
}

export function generateEnhancedLocalBusinessSchema(business: LocalBusinessData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${business.website}#business`,
    name: business.name,
    description: business.description,
    url: business.website,
    address: {
      '@type': 'PostalAddress',
      ...business.address
    },
    telephone: business.telephone,
    email: business.email,
    openingHours: business.openingHours,
    priceRange: business.priceRange,
    paymentAccepted: business.paymentAccepted,
    currenciesAccepted: business.currenciesAccepted,
    areaServed: business.areaServed.map(area => ({
      '@type': 'Place',
      name: area
    })),
    sameAs: [
      'https://www.facebook.com/sina.lk',
      'https://www.instagram.com/sina.lk',
      'https://twitter.com/sinalk'
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sri Lankan Authentic Products',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Handmade Crafts',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Traditional Masks' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Wooden Carvings' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Batik Textiles' } }
          ]
        },
        {
          '@type': 'OfferCatalog',
          name: 'Ceylon Tea & Spices',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Ceylon Black Tea' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Ceylon Cinnamon' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Authentic Spice Blends' } }
          ]
        }
      ]
    }
  };
}

// Website Schema with Enhanced Search Action
export function generateWebsiteSearchSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://sina.lk#website',
    name: 'Sina.lk - Sri Lankan Marketplace',
    alternateName: ['Sri Lankan Marketplace', 'Authentic Sri Lankan Products'],
    url: 'https://sina.lk',
    description: 'Discover authentic Sri Lankan products, handmade crafts, traditional textiles, Ceylon tea, and unique artisan creations.',
    inLanguage: ['en-US', 'si-LK', 'ta-LK'],
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://sina.lk/search?q={search_term_string}&category={category}&location={location}'
        },
        'query-input': [
          'required name=search_term_string',
          'name=category',
          'name=location'
        ]
      }
    ],
    publisher: {
      '@type': 'Organization',
      '@id': 'https://sina.lk#organization',
      name: 'Sina.lk',
      url: 'https://sina.lk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sina.lk/logo.svg',
        width: 300,
        height: 300
      }
    }
  };
}

// Breadcrumb Schema with Enhanced Metadata
export interface BreadcrumbItem {
  name: string;
  url: string;
  image?: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url,
        name: item.name,
        url: item.url,
        image: item.image
      }
    }))
  };
}

// Marketplace/E-commerce Platform Schema
export function generateMarketplaceSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': 'https://sina.lk#store',
    name: 'Sina.lk - Sri Lankan Marketplace',
    description: 'Premier online marketplace for authentic Sri Lankan products and handmade crafts',
    url: 'https://sina.lk',
    image: 'https://sina.lk/logo.svg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LK',
      addressRegion: 'Western Province',
      addressLocality: 'Colombo'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sri Lankan Products Catalog',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Arts & Crafts',
          description: 'Traditional Sri Lankan handmade arts and crafts'
        },
        {
          '@type': 'OfferCatalog',
          name: 'Food & Beverages',
          description: 'Authentic Ceylon tea, spices, and traditional foods'
        },
        {
          '@type': 'OfferCatalog',
          name: 'Fashion & Textiles',
          description: 'Traditional clothing, batik, and handwoven textiles'
        },
        {
          '@type': 'OfferCatalog',
          name: 'Jewelry & Accessories',
          description: 'Handcrafted jewelry and traditional accessories'
        }
      ]
    },
    brand: {
      '@type': 'Brand',
      name: 'Sina.lk',
      logo: 'https://sina.lk/logo.svg',
      description: 'Trusted platform for authentic Sri Lankan products'
    },
    foundingDate: '2024',
    foundingLocation: 'Sri Lanka',
    areaServed: [
      'Sri Lanka',
      'Worldwide'
    ],
    knowsLanguage: ['en', 'si', 'ta'],
    acceptedPaymentMethod: [
      'Credit Card',
      'Debit Card',
      'PayPal',
      'Bank Transfer'
    ],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sina.lk/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

// Collection Page Schema for Categories
export interface CollectionData {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  items?: Array<{ name: string; url: string; image?: string; price?: number }>;
}

export function generateCollectionPageSchema(collection: CollectionData): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    mainEntity: {
      '@type': 'ItemList',
      name: collection.name,
      description: collection.description,
      numberOfItems: collection.numberOfItems
    }
  };

  if (collection.items && collection.items.length > 0) {
    schema.mainEntity.itemListElement = collection.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        image: item.image,
        offers: item.price ? {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: 'LKR'
        } : undefined
      }
    }));
  }

  return schema;
}

// Combine multiple schemas into one script
export function combineSchemas(...schemas: object[]): object {
  return {
    '@graph': schemas
  };
}

// SEO Performance Enhancement Schema
export function generatePerformanceSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Sina.lk Performance Metrics',
    description: 'Website performance and user experience data',
    creator: {
      '@type': 'Organization',
      name: 'Sina.lk'
    },
    keywords: [
      'performance',
      'core web vitals',
      'user experience',
      'sri lankan marketplace'
    ]
  };
}
