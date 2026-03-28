import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // First, let's see existing users
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true }
  })
  console.log('Existing users:', users)

  // Create or update the admin user with correct credentials
  const hashedPassword = await bcrypt.hash('abdo318', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'adminkms@abdoaig' },
    update: {
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
    create: {
      email: 'adminkms@abdoaig',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  })

  console.log('✅ Admin user created/updated:', admin.email)
  console.log('📧 Email: adminkms@abdoaig')
  console.log('🔑 Password: abdo318')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
