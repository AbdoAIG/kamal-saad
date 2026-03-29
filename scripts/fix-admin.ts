import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Update admin with correct role and password
  const hashedPassword = await bcrypt.hash('abdo318', 10)
  
  const admin = await prisma.user.update({
    where: { email: 'adminkms@abdoaig' },
    data: {
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  })

  console.log('✅ Admin user fixed:')
  console.log('  Email:', admin.email)
  console.log('  Role:', admin.role)
  console.log('  Password: abdo318')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
