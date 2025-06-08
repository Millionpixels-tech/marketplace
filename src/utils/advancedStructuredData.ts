/**
 * Advanced Structured Data Utilities for SinaMarketplace
 * Provides comprehensive structured data generation for various content types
 */

export interface Review {
  rating: number;
  reviewBody: string;
  author: string;
  datePublished: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  brand?: string;
  reviews?: Review[];
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  seller: {
    name: string;
    url: string;
  };
}

export interface LocalBusiness {
  name: string;
  description: string;
  url: string;
  logo: string;
  image: string;
  telephone?: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
}

/**
 * Generates Product structured data with comprehensive details
 */
export function generateProductStructuredData(product: Product): object {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      url: `https://sinamarketplace.com/listing/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: product.seller.name,
        url: product.seller.url,
      },
      itemCondition: `https://schema.org/${product.condition}`,
    },
  };

  // Add brand if available
  if (product.brand) {
    structuredData.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }

  // Add aggregated rating if reviews exist
  if (product.reviews && product.reviews.length > 0) {
    const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
    
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: product.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };

    // Add individual reviews
    structuredData.review = product.reviews.map(review => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.reviewBody,
      author: {
        '@type': 'Person',
        name: review.author,
      },
      datePublished: review.datePublished,
    }));
  }

  return structuredData;
}

/**
 * Generates LocalBusiness structured data for shops
 */
export function generateLocalBusinessStructuredData(business: LocalBusiness): object {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: business.url,
    logo: business.logo,
    image: business.image,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.streetAddress,
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      postalCode: business.address.postalCode,
      addressCountry: business.address.addressCountry,
    },
  };

  if (business.telephone) {
    structuredData.telephone = business.telephone;
  }

  if (business.geo) {
    structuredData.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    };
  }

  if (business.openingHours) {
    structuredData.openingHours = business.openingHours;
  }

  if (business.priceRange) {
    structuredData.priceRange = business.priceRange;
  }

  return structuredData;
}

/**
 * Generates Article structured data for blog posts and guides
 */
export function generateArticleStructuredData(
  title: string,
  content: string,
  author: string,
  datePublished: string,
  dateModified?: string,
  image?: string,
  url?: string
): object {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    articleBody: content,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'SinaMarketplace',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sinamarketplace.com/logo.png',
      },
    },
  };

  if (dateModified) {
    structuredData.dateModified = dateModified;
  }

  if (image) {
    structuredData.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  if (url) {
    structuredData.url = url;
  }

  return structuredData;
}

/**
 * Generates SearchAction structured data for search functionality
 */
export function generateSearchActionStructuredData(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://sinamarketplace.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://sinamarketplace.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates ItemList structured data for search results and categories
 */
export function generateItemListStructuredData(
  items: Array<{ name: string; url: string; image?: string }>,
  listName: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        image: item.image,
      },
    })),
  };
}

/**
 * Generates WebPage structured data
 */
export function generateWebPageStructuredData(
  name: string,
  description: string,
  url: string,
  image?: string,
  breadcrumbs?: Array<{ name: string; url: string }>
): object {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      name: 'SinaMarketplace',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sinamarketplace.com/logo.png',
      },
    },
  };

  if (image) {
    structuredData.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    structuredData.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  return structuredData;
}

/**
 * Generates Event structured data for marketplace events
 */
export function generateEventStructuredData(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  location: string,
  url?: string,
  image?: string
): object {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    organizer: {
      '@type': 'Organization',
      name: 'SinaMarketplace',
      url: 'https://sinamarketplace.com',
    },
  };

  if (url) {
    structuredData.url = url;
  }

  if (image) {
    structuredData.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  return structuredData;
}

/**
 * Generates Review structured data
 */
export function generateReviewStructuredData(
  itemName: string,
  reviewBody: string,
  rating: number,
  author: string,
  datePublished: string,
  itemUrl?: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: itemName,
      url: itemUrl,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
  };
}

/**
 * Combines multiple structured data objects into a single script tag content
 */
export function combineStructuredData(structuredDataArray: object[]): object {
  if (structuredDataArray.length === 1) {
    return structuredDataArray[0];
  }

  return {
    '@context': 'https://schema.org',
    '@graph': structuredDataArray,
  };
}

/**
 * Validates structured data format
 */
export function validateStructuredData(data: object): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const jsonString = JSON.stringify(data);
    JSON.parse(jsonString);
  } catch (error) {
    errors.push('Invalid JSON format');
    return { isValid: false, errors };
  }

  // Check for required properties
  const dataObj = data as any;
  if (!dataObj['@context']) {
    errors.push('Missing @context property');
  }
  if (!dataObj['@type']) {
    errors.push('Missing @type property');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
