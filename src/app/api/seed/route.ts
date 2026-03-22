import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const categories = [
  { name: 'Pens & Pencils', nameAr: 'أقلام ومصنفات', slug: 'pens-pencils' },
  { name: 'Notebooks', nameAr: 'دفاتر وكراسات', slug: 'notebooks' },
  { name: 'School Bags', nameAr: 'حقائب مدرسية', slug: 'school-bags' },
  { name: 'Art Supplies', nameAr: 'أدوات فنية', slug: 'art-supplies' },
  { name: 'Office Tools', nameAr: 'أدوات مكتبية', slug: 'office-tools' },
  { name: 'Educational', nameAr: 'أدوات تعليمية', slug: 'educational' },
];

const products = [
  // Pens & Pencils
  { name: 'Premium Ballpoint Pens Pack', nameAr: 'مجموعة أقلام حبر كروم متميزة', description: 'Set of 12 high-quality ballpoint pens with smooth writing', descriptionAr: 'مجموعة من 12 قلم حبر كروم عالي الجودة بكتابة ناعمة', price: 25, discountPrice: 20, stock: 150, categorySlug: 'pens-pencils', featured: true, images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'] },
  { name: 'Colored Pencils Set 24 Colors', nameAr: 'مجموعة أقلام ملونة 24 لون', description: 'Professional colored pencils for artists and students', descriptionAr: 'أقلام ملونة احترافية للفنانين والطلاب', price: 35, stock: 80, categorySlug: 'pens-pencils', featured: true, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'] },
  { name: 'Mechanical Pencil 0.5mm', nameAr: 'قلم رصاص ميكانيكي 0.5 مم', description: 'Precision mechanical pencil with eraser', descriptionAr: 'قلم رصاص ميكانيكي دقيق مع ممحاة', price: 15, stock: 200, categorySlug: 'pens-pencils', images: ['https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=400'] },
  { name: 'Highlighters Set 6 Colors', nameAr: 'مجموعة أقلام تمييز 6 ألوان', description: 'Bright highlighters for studying and office work', descriptionAr: 'أقلام تمييز ساطعة للدراسة والعمل المكتبي', price: 18, stock: 120, categorySlug: 'pens-pencils', images: ['https://images.unsplash.com/photo-1612810806695-30f7a8258391?w=400'] },
  { name: 'Gel Pens Assorted Colors', nameAr: 'أقلام جل متنوعة الألوان', description: 'Smooth writing gel pens in 10 colors', descriptionAr: 'أقلام جل بكتابة ناعمة بـ 10 ألوان', price: 28, stock: 100, categorySlug: 'pens-pencils', images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'] },
  
  // Notebooks
  { name: 'A5 Notebook Lined', nameAr: 'دفتر A5 مسطر', description: 'Premium quality lined notebook, 100 pages', descriptionAr: 'دفتر مسطر عالي الجودة، 100 صفحة', price: 20, stock: 300, categorySlug: 'notebooks', featured: true, images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400'] },
  { name: 'A4 Notebook Grid', nameAr: 'دفتر A4 مربعات', description: 'Grid notebook perfect for math and science', descriptionAr: 'دفتر مربعات مثالي للرياضيات والعلوم', price: 25, stock: 200, categorySlug: 'notebooks', images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=400'] },
  { name: 'Leather Journal', nameAr: 'مفكرة جلدية', description: 'Elegant leather-bound journal for personal notes', descriptionAr: 'مفكرة أنيقة بغلاف جلدي للملاحظات الشخصية', price: 65, discountPrice: 50, stock: 50, categorySlug: 'notebooks', featured: true, images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'] },
  { name: 'Sketchbook A4', nameAr: 'كراسة رسم A4', description: 'Blank sketchbook for artists, 80 pages', descriptionAr: 'كراسة رسم بيضاء للفنانين، 80 صفحة', price: 30, stock: 90, categorySlug: 'notebooks', images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'] },
  { name: 'Spiral Notebook Set', nameAr: 'مجموعة دفاتر حلزونية', description: 'Pack of 3 spiral notebooks in different colors', descriptionAr: 'مجموعة من 3 دفاتر حلزونية بألوان مختلفة', price: 35, stock: 150, categorySlug: 'notebooks', images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400'] },

  // School Bags
  { name: 'Kids School Backpack', nameAr: 'حقيبة مدرسية للأطفال', description: 'Colorful and durable backpack for young students', descriptionAr: 'حقيبة ظهر ملونة ومتينة للطلاب الصغار', price: 85, discountPrice: 70, stock: 60, categorySlug: 'school-bags', featured: true, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'] },
  { name: 'Teen Backpack Large', nameAr: 'حقيبة ظهر كبيرة للمراهقين', description: 'Spacious backpack with laptop compartment', descriptionAr: 'حقيبة ظهر واسعة مع جيب للابتوب', price: 120, stock: 40, categorySlug: 'school-bags', images: ['https://images.unsplash.com/photo-1581605405669-fcdf8115afa3?w=400'] },
  { name: 'Pencil Case Large', nameAr: 'ممحاة أقلام كبيرة', description: 'Large capacity pencil case with compartments', descriptionAr: 'محفظة أقلام كبيرة السعة مع جيوب', price: 25, stock: 180, categorySlug: 'school-bags', images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'] },
  { name: 'Lunch Box Set', nameAr: 'مجموعة علبة طعام', description: 'Insulated lunch box with water bottle', descriptionAr: 'علبة طعام معزولة مع قارورة ماء', price: 45, stock: 75, categorySlug: 'school-bags', images: ['https://images.unsplash.com/photo-1581605405669-fcdf8115afa3?w=400'] },

  // Art Supplies
  { name: 'Watercolor Paint Set', nameAr: 'مجموعة ألوان مائية', description: 'Professional watercolor palette with 24 colors', descriptionAr: 'لوحة ألوان مائية احترافية بـ 24 لون', price: 55, stock: 55, categorySlug: 'art-supplies', featured: true, images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'] },
  { name: 'Acrylic Paint Set 12 Colors', nameAr: 'مجموعة ألوان أكريليك 12 لون', description: 'Vibrant acrylic paints for canvas painting', descriptionAr: 'ألوان أكريليك زاهية للرسم على القماش', price: 40, stock: 70, categorySlug: 'art-supplies', images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'] },
  { name: 'Paint Brush Set', nameAr: 'مجموعة فرش رسم', description: 'Professional brush set in various sizes', descriptionAr: 'مجموعة فرش احترافية بأحجام مختلفة', price: 35, stock: 100, categorySlug: 'art-supplies', images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'] },
  { name: 'Canvas Panel Set', nameAr: 'مجموعة لوحات رسم', description: 'Set of 5 canvas panels for painting', descriptionAr: 'مجموعة من 5 لوحات رسم للرسم', price: 50, stock: 45, categorySlug: 'art-supplies', images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'] },

  // Office Tools
  { name: 'Desktop Organizer', nameAr: 'منظم مكتب', description: 'Multi-compartment desk organizer for supplies', descriptionAr: 'منظم مكتب متعدد الجيوب للمستلزمات', price: 45, stock: 65, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Stapler Heavy Duty', nameAr: 'دباسة قوية', description: 'Heavy-duty stapler for office use', descriptionAr: 'دباسة قوية للاستخدام المكتب', price: 30, stock: 90, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Scissors Set', nameAr: 'مجموعة مقصات', description: 'Set of 3 scissors for different purposes', descriptionAr: 'مجموعة من 3 مقصات لأغراض مختلفة', price: 25, stock: 110, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Paper Clips Box', nameAr: 'علبة مشابك ورق', description: 'Assorted paper clips in storage box', descriptionAr: 'مشابك ورق متنوعة في علبة تخزين', price: 12, stock: 200, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Tape Dispenser', nameAr: 'موزع شريط لاصق', description: 'Desktop tape dispenser with included tape', descriptionAr: 'موزع شريط لاصق مكتبي مع شريط مرفق', price: 18, stock: 130, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Calculator Scientific', nameAr: 'آلة حاسبة علمية', description: 'Scientific calculator for students', descriptionAr: 'آلة حاسبة علمية للطلاب', price: 55, stock: 85, categorySlug: 'office-tools', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },

  // Educational
  { name: 'World Map Poster', nameAr: 'ملصق خريطة العالم', description: 'Large colorful world map for classrooms', descriptionAr: 'خريطة عالم كبيرة وملونة للفصول الدراسية', price: 30, stock: 70, categorySlug: 'educational', images: ['https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400'] },
  { name: 'Math Flash Cards', nameAr: 'بطاقات تعليم رياضيات', description: 'Educational flash cards for math learning', descriptionAr: 'بطاقات تعليمية لتعلم الرياضيات', price: 22, stock: 120, categorySlug: 'educational', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Alphabet Learning Set', nameAr: 'مجموعة تعليم الحروف', description: 'Interactive alphabet learning materials', descriptionAr: 'مواد تعليمية تفاعلية للحروف', price: 35, stock: 100, categorySlug: 'educational', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Geometric Shapes Set', nameAr: 'مجموعة أشكال هندسية', description: '3D geometric shapes for math education', descriptionAr: 'أشكال هندسية ثلاثية الأبعاد لتعليم الرياضيات', price: 40, stock: 60, categorySlug: 'educational', images: ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'] },
  { name: 'Globe Mini', nameAr: 'كرة أرضية صغيرة', description: 'Mini globe for desk or classroom', descriptionAr: 'كرة أرضية صغيرة للمكتب أو الفصل الدراسي', price: 45, stock: 50, categorySlug: 'educational', featured: true, images: ['https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400'] },
];

export async function POST() {
  try {
    // Clear existing data
    await db.cartItem.deleteMany();
    await db.cart.deleteMany();
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.product.deleteMany();
    await db.category.deleteMany();
    await db.user.deleteMany();

    // Create admin user
    await db.user.create({
      data: {
        email: 'admin@maktbati.com',
        name: 'المشرف',
        password: 'admin123',
        role: 'admin'
      }
    });

    // Create categories
    const categoryMap: Record<string, string> = {};
    for (const cat of categories) {
      const created = await db.category.create({
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
        }
      });
      categoryMap[cat.slug] = created.id;
    }

    // Create products
    for (const prod of products) {
      await db.product.create({
        data: {
          name: prod.name,
          nameAr: prod.nameAr,
          description: prod.description,
          descriptionAr: prod.descriptionAr,
          price: prod.price,
          discountPrice: prod.discountPrice || null,
          images: JSON.stringify(prod.images),
          stock: prod.stock,
          categoryId: categoryMap[prod.categorySlug],
          featured: prod.featured || false,
          rating: 3.5 + Math.random() * 1.5,
          reviewsCount: Math.floor(Math.random() * 50),
          salesCount: Math.floor(Math.random() * 100),
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      categories: categories.length,
      products: products.length
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
