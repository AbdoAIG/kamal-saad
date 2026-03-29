import { Suspense } from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { HomePageClient } from '@/components/store/HomePageClient';

// ── Page-level SEO metadata (overrides layout defaults for this page) ──
export const metadata: Metadata = {
  title: 'Kamal Saad | كمال سعد - Office & School Supplies',
  description:
    'متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر. أقلام، دفاتر، حقائب، أدوات فنية ومكتبية. Kamal Saad - Your #1 online store for office & school supplies in Egypt.',
  keywords: [
    'كمال سعد',
    'مستلزمات مدرسية',
    'مستلزمات مكتبية',
    'أقلام',
    'دفاتر',
    'حقائب مدرسية',
    'أدوات فنية',
    'قرطاسية',
    'Egypt stationery',
    'Kamal Saad',
    'school supplies Egypt',
    'office supplies',
  ],
  openGraph: {
    title: 'Kamal Saad | كمال سعد - Office & School Supplies',
    description:
      'متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر',
    type: 'website',
    siteName: 'Kamal Saad | كمال سعد',
    images: [{ url: '/logo.png', width: 200, height: 200, alt: 'Kamal Saad Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kamal Saad | كمال سعد - Office & School Supplies',
    description:
      'متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://kamal-saad.vercel.app',
  },
};

// ISR: revalidate every 60 seconds for fresh product data without full rebuilds
export const revalidate = 60;

// ── Server-side data fetching ──
async function getInitialData(searchQuery: string, categoryFilter: string) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { nameAr: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  if (categoryFilter && categoryFilter !== 'all') {
    where.categoryId = categoryFilter;
  }

  const [categories, productsData, productsCount] = await Promise.all([
    db.category.findMany({ orderBy: { nameAr: 'asc' } }),
    db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.product.count({ where }),
  ]);

  return {
    categories,
    products: productsData,
    totalProducts: productsCount,
    totalPages: Math.ceil(productsCount / 20),
  };
}

// ── Server Component (no 'use client') ──
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search || '';
  const categoryFilter = params.category || '';

  let initialData = null;
  let isEmpty = false;

  try {
    initialData = await getInitialData(searchQuery, categoryFilter);
    isEmpty = initialData.categories.length === 0;
  } catch (error) {
    console.error('Error fetching initial data for homepage:', error);
  }

  // Serialize Prisma data for client props (Date → ISO string)
  const serializedProducts = (initialData?.products || []).map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    price: p.price,
    discountPrice: p.discountPrice,
    images: p.images,
    stock: p.stock,
    categoryId: p.categoryId,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    salesCount: p.salesCount,
    featured: p.featured,
    hasVariants: p.hasVariants,
    deletedAt: p.deletedAt,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: p.category
      ? { id: p.category.id, name: p.category.name, nameAr: p.category.nameAr }
      : undefined,
  }));

  const serializedCategories = (initialData?.categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    slug: c.slug,
    image: c.image,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePageClient
        initialCategories={serializedCategories}
        initialProducts={serializedProducts}
        totalProducts={initialData?.totalProducts || 0}
        totalPages={initialData?.totalPages || 0}
        isEmpty={isEmpty}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
      />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
      <div className="text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-teal-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          جاري تحميل المتجر...
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading store...
        </p>
      </div>
    </div>
  );
}
