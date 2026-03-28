import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Roles
  console.log('Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: 'role-admin',
      name: 'admin',
      nameAr: 'مدير',
      description: 'Full system administrator',
      color: '#ef4444',
      isDefault: false,
      isActive: true,
    },
  })

  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: {
      id: 'role-customer',
      name: 'customer',
      nameAr: 'عميل',
      description: 'Regular customer',
      color: '#22c55e',
      isDefault: true,
      isActive: true,
    },
  })

  // Create Admin User
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kamal-saad.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@kamal-saad.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      roleId: adminRole.id,
      isActive: true,
    },
  })

  // Create test customer
  console.log('Creating test customer...')
  const customerPassword = await bcrypt.hash('customer123', 10)
  
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      id: 'user-customer',
      email: 'customer@test.com',
      name: 'Test Customer',
      password: customerPassword,
      role: 'customer',
      roleId: customerRole.id,
      isActive: true,
    },
  })

  // Create Categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'perfumes' },
      update: {},
      create: {
        id: 'cat-perfumes',
        name: 'Perfumes',
        nameAr: 'عطور',
        slug: 'perfumes',
        description: 'Premium perfumes and fragrances',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'oils' },
      update: {},
      create: {
        id: 'cat-oils',
        name: 'Oils',
        nameAr: 'زيوت',
        slug: 'oils',
        description: 'Natural essential oils',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'incense' },
      update: {},
      create: {
        id: 'cat-incense',
        name: 'Incense',
        nameAr: 'بخور',
        slug: 'incense',
        description: 'Premium incense and oud',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'gifts' },
      update: {},
      create: {
        id: 'cat-gifts',
        name: 'Gifts',
        nameAr: 'هدايا',
        slug: 'gifts',
        description: 'Special gift sets',
      },
    }),
  ])

  // Create Products
  console.log('Creating products...')
  const products = [
    {
      id: 'prod-1',
      name: 'Royal Oud Perfume',
      nameAr: 'عطر العود الملكي',
      description: 'A luxurious blend of authentic oud with hints of amber and musk',
      descriptionAr: 'مزيج فاخر من العود الأصيل مع لمسات من العنبر والمسك',
      price: 299.99,
      discountPrice: 249.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500']),
      stock: 50,
      categoryId: categories[0].id,
      featured: true,
      rating: 4.8,
      reviewsCount: 24,
      salesCount: 156,
    },
    {
      id: 'prod-2',
      name: 'Arabian Nights',
      nameAr: 'ليالي عربية',
      description: 'An enchanting fragrance inspired by Arabian nights',
      descriptionAr: 'عطر ساحر مستوحى من ليالي العربية',
      price: 199.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500']),
      stock: 35,
      categoryId: categories[0].id,
      featured: true,
      rating: 4.6,
      reviewsCount: 18,
      salesCount: 89,
    },
    {
      id: 'prod-3',
      name: 'Rose Oud',
      nameAr: 'عود الورد',
      description: 'Delicate rose petals combined with rich oud',
      descriptionAr: 'بتلات ورد رقيقة ممزوجة بالعود الغني',
      price: 349.99,
      discountPrice: 299.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1595425959632-34f2822322ce?w=500']),
      stock: 25,
      categoryId: categories[0].id,
      featured: false,
      rating: 4.9,
      reviewsCount: 32,
      salesCount: 201,
    },
    {
      id: 'prod-4',
      name: 'Sandalwood Oil',
      nameAr: 'زيت خشب الصندل',
      description: 'Pure sandalwood essential oil for relaxation',
      descriptionAr: 'زيت خشب الصندل النقي للاسترخاء',
      price: 149.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500']),
      stock: 60,
      categoryId: categories[1].id,
      featured: true,
      rating: 4.5,
      reviewsCount: 15,
      salesCount: 78,
    },
    {
      id: 'prod-5',
      name: 'Lavender Dreams Oil',
      nameAr: 'زيت أحلام الخزامى',
      description: 'Calming lavender essential oil',
      descriptionAr: 'زيت الخزامى المهدئ',
      price: 89.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500']),
      stock: 80,
      categoryId: categories[1].id,
      featured: false,
      rating: 4.4,
      reviewsCount: 22,
      salesCount: 134,
    },
    {
      id: 'prod-6',
      name: 'Royal Incense',
      nameAr: 'بخور ملكي',
      description: 'Premium Arabian incense for special occasions',
      descriptionAr: 'بخور عربي فاخر للمناسبات الخاصة',
      price: 79.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1608614166810-8c0d4d4c5c87?w=500']),
      stock: 100,
      categoryId: categories[2].id,
      featured: true,
      rating: 4.7,
      reviewsCount: 45,
      salesCount: 289,
    },
    {
      id: 'prod-7',
      name: 'Oud Incense Sticks',
      nameAr: 'عود بخور',
      description: 'Traditional oud incense sticks',
      descriptionAr: 'عود بخور تقليدي',
      price: 49.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1615868748496-f7b40c1f9fc8?w=500']),
      stock: 150,
      categoryId: categories[2].id,
      featured: false,
      rating: 4.3,
      reviewsCount: 38,
      salesCount: 456,
    },
    {
      id: 'prod-8',
      name: 'Luxury Gift Set',
      nameAr: 'مجموعة هدايا فاخرة',
      description: 'Complete gift set with perfume, oil and incense',
      descriptionAr: 'مجموعة هدايا كاملة مع عطر وزيت وبخور',
      price: 499.99,
      discountPrice: 449.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500']),
      stock: 20,
      categoryId: categories[3].id,
      featured: true,
      rating: 5.0,
      reviewsCount: 12,
      salesCount: 67,
    },
    {
      id: 'prod-9',
      name: 'Musk Collection',
      nameAr: 'مجموعة المسك',
      description: 'Exclusive musk-based perfume collection',
      descriptionAr: 'مجموعة عطور المسك الحصرية',
      price: 399.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500']),
      stock: 30,
      categoryId: categories[0].id,
      featured: true,
      rating: 4.8,
      reviewsCount: 28,
      salesCount: 145,
    },
    {
      id: 'prod-10',
      name: 'Amber Essence',
      nameAr: 'جوهر العنبر',
      description: 'Rich amber perfume with oriental notes',
      descriptionAr: 'عطر العنبر الغني بلمسات شرقية',
      price: 259.99,
      discountPrice: 219.99,
      images: JSON.stringify(['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500']),
      stock: 45,
      categoryId: categories[0].id,
      featured: false,
      rating: 4.6,
      reviewsCount: 19,
      salesCount: 98,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  // Create Banners
  console.log('Creating banners...')
  const banners = [
    {
      id: 'banner-1',
      title: 'New Collection',
      titleAr: 'مجموعة جديدة',
      subtitle: 'Discover our latest perfumes',
      subtitleAr: 'اكتشف أحدث عطورنا',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200',
      link: '/products',
      buttonText: 'Shop Now',
      buttonTextAr: 'تسوق الآن',
      active: true,
      order: 1,
    },
    {
      id: 'banner-2',
      title: 'Special Offers',
      titleAr: 'عروض خاصة',
      subtitle: 'Up to 30% off on selected items',
      subtitleAr: 'خصم يصل إلى 30% على منتجات مختارة',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200',
      link: '/products?featured=true',
      buttonText: 'View Offers',
      buttonTextAr: 'عرض العروض',
      active: true,
      order: 2,
    },
  ]
  
  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: {},
      create: banner,
    })
  }

  // Create Site Settings
  console.log('Creating site settings...')
  const settings = [
    {
      id: 'setting-1',
      key: 'site_name',
      value: 'Kamal Saad',
      type: 'text',
      group: 'general',
      label: 'Site Name',
      labelAr: 'اسم الموقع',
    },
    {
      id: 'setting-2',
      key: 'site_name_ar',
      value: 'كمال سعد',
      type: 'text',
      group: 'general',
      label: 'Site Name (Arabic)',
      labelAr: 'اسم الموقع بالعربية',
    },
    {
      id: 'setting-3',
      key: 'currency',
      value: 'EGP',
      type: 'text',
      group: 'general',
      label: 'Currency',
      labelAr: 'العملة',
    },
    {
      id: 'setting-4',
      key: 'shipping_cost',
      value: '50',
      type: 'number',
      group: 'shipping',
      label: 'Shipping Cost',
      labelAr: 'تكلفة الشحن',
    },
  ]
  
  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Create Permissions for Admin Role
  console.log('Creating permissions...')
  const permissions = [
    { resource: 'products', action: 'create' },
    { resource: 'products', action: 'read' },
    { resource: 'products', action: 'update' },
    { resource: 'products', action: 'delete' },
    { resource: 'orders', action: 'create' },
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'update' },
    { resource: 'orders', action: 'delete' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'read' },
    { resource: 'categories', action: 'update' },
    { resource: 'categories', action: 'delete' },
    { resource: 'coupons', action: 'create' },
    { resource: 'coupons', action: 'read' },
    { resource: 'coupons', action: 'update' },
    { resource: 'coupons', action: 'delete' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' },
    { resource: 'reports', action: 'read' },
    { resource: 'banners', action: 'create' },
    { resource: 'banners', action: 'read' },
    { resource: 'banners', action: 'update' },
    { resource: 'banners', action: 'delete' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        roleId_resource_action: {
          roleId: adminRole.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        resource: perm.resource,
        action: perm.action,
      },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('   Admin: admin@kamal-saad.com / admin123')
  console.log('   Customer: customer@test.com / customer123')
  console.log('')
  console.log(`📦 Created ${products.length} products`)
  console.log(`📁 Created ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
