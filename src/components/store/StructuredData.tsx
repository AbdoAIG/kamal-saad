interface ProductJsonLd {
  id: string;
  name: string;
  nameAr: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  images: string;
  category?: { name: string; nameAr: string } | null;
  rating: number;
  reviewsCount: number;
}

export function StoreStructuredData() {
  const storeData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'كمال سعد - Kamal Saad',
    description: 'متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر',
    url: 'https://kamal-saad.vercel.app',
    image: '/logo.png',
    telephone: '+201000000000',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
    },
    priceRange: '$$',
    sameAs: [
      'https://facebook.com/kamalsaad',
      'https://instagram.com/kamalsaad',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(storeData) }}
    />
  );
}

export function ProductListStructuredData({ products }: { products: ProductJsonLd[] }) {
  if (products.length === 0) return null;

  const productItems = products.slice(0, 20).map(product => {
    let images: string[] = [];
    try { images = JSON.parse(product.images || '[]'); } catch { images = []; }

    return {
      '@type': 'ListItem',
      position: products.indexOf(product) + 1,
      item: {
        '@type': 'Product',
        name: product.nameAr || product.name,
        description: product.description || '',
        image: images[0] || '',
        offers: {
          '@type': 'Offer',
          price: (product.discountPrice || product.price).toString(),
          priceCurrency: 'EGP',
          availability: product.price > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
        aggregateRating: product.reviewsCount > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating.toString(),
          reviewCount: product.reviewsCount.toString(),
        } : undefined,
      },
    };
  });

  const listData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'منتجات كمال سعد',
    itemListElement: productItems,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(listData) }}
    />
  );
}

export function BreadcrumbStructuredData() {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://kamal-saad.vercel.app',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'كمال سعد - Kamal Saad',
    url: 'https://kamal-saad.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://kamal-saad.vercel.app/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
