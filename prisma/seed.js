const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const superuserPassword = await bcrypt.hash('Admin@123', 12)
  
  const superuser = await prisma.user.upsert({
    where: { email: 'admin@chefmanager.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@chefmanager.com',
      password: superuserPassword,
      role: 'SUPERUSER',
    },
  })

  console.log('✅ Superuser created:', superuser.email)
  console.log('🔑 Password: Admin@123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
