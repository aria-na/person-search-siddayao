import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
  { name: 'John Doe', phoneNumber: '0412345678', email: 'john@example.com' },
  { name: 'Jane Smith', phoneNumber: '0423456789', email: 'jane@example.com' },
  { name: 'Alice Johnson', phoneNumber: '0434567890', email: 'alice@example.com' },
  { name: 'Bob Williams', phoneNumber: '0445678901', email: 'bob@example.com' },
  { name: 'Charlie Brown', phoneNumber: '0456789012', email: 'charlie@example.com' },
  { name: 'Emily Davis', phoneNumber: '0467890123', email: 'emily@example.com' },
  { name: 'Frank Miller', phoneNumber: '0478901234', email: 'frank@example.com' },
  { name: 'Grace Lee', phoneNumber: '0489012345', email: 'grace@example.com' },
  { name: 'Henry Moore', phoneNumber: '0490123456', email: 'henry@example.com' },
  { name: 'Isabella Young', phoneNumber: '0401234567', email: 'isabella@example.com' },
  { name: 'Mikael Estillore', phoneNumber: '0491234567', email: 'mikael@example.com' }
]

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        phoneNumber: user.phoneNumber
      },
      create: user
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
