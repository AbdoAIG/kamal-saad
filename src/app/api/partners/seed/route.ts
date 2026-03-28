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

// POST - Seed default partners (called from admin panel, auth checked client-side)
export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const partner of defaultPartners) {
      const existing = await db.partner.findFirst({
        where: { name: partner.name },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await db.partner.create({
        data: {
          name: partner.name,
          nameAr: partner.nameAr,
          logo: partner.logo,
          order: partner.order,
          active: true,
        },
      });
      created++;
    }

    const allPartners = await db.partner.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${created} شريك، تم تخطي ${skipped} موجود مسبقاً`,
      data: allPartners,
    });
  } catch (error) {
    console.error('Error seeding partners:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة الشركاء الافتراضيين' },
      { status: 500 }
    );
  }
}
