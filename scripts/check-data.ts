import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.count()
  const categories = await prisma.category.count()
  const banners = await prisma.banner.count()
  
  console.log('📊 Database Stats:')
  console.log('  Products:', products)
  console.log('  Categories:', categories)
  console.log('  Banners:', banners)
  
  // Show some products
  const sampleProducts = await prisma.product.findMany({
    take: 3,
    select: { name: true, price: true }
  })
  console.log('\n📦 Sample Products:', sampleProducts)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
