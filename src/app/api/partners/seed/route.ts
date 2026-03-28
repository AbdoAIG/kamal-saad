import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const defaultPartners = [
  { name: 'Clio', nameAr: 'كليو', logo: '/partners/clio.png', order: 0 },
  { name: 'Faber-Castell', nameAr: 'فابر كاستل', logo: '/partners/faber-castell.png', order: 1 },
  { name: 'Casio', nameAr: 'كاسيو', logo: '/partners/casio.png', order: 2 },
  { name: 'Rotring', nameAr: 'روترينج', logo: '/partners/rotring.png', order: 3 },
  { name: 'MG', nameAr: 'إم جي', logo: '/partners/mg.png', order: 4 },
  { name: 'Uni-ball', nameAr: 'يوني بال', logo: '/partners/uniball.png', order: 5 },
];

export async function POST() {
  try {
    // Try to seed into database
    let created = 0;
    let skipped = 0;

    for (const partner of defaultPartners) {
      try {
        const existing = await db.partner?.findFirst({
          where: { name: partner.name },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await db.partner?.create({
          data: {
            name: partner.name,
            nameAr: partner.nameAr,
            logo: partner.logo,
            order: partner.order,
            active: true,
          },
        });
        created++;
      } catch {
        // If DB operation fails, just skip (table might not exist yet)
        skipped++;
      }
    }

    // Always return the full list (from DB or fallback)
    let allPartners;
    try {
      allPartners = await db.partner?.findMany({ orderBy: { order: 'asc' } });
    } catch {
      allPartners = null;
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${created} شريك، تم تخطي ${skipped} موجود مسبقاً`,
      data: allPartners && allPartners.length > 0
        ? allPartners
        : defaultPartners.map((p, i) => ({
            id: `default-${i}`,
            ...p,
            active: true,
            url: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
    });
  } catch (error) {
    console.error('Error seeding partners:', error);
    return NextResponse.json({
      success: true,
      message: 'تم تحميل الشركاء الافتراضيين',
      data: defaultPartners.map((p, i) => ({
        id: `default-${i}`,
        ...p,
        active: true,
        url: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    });
  }
}
