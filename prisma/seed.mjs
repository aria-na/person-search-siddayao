import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
  { name: 'John Doe', phoneNumber: '09171234567', email: 'john@example.com' },
  { name: 'Jane Smith', phoneNumber: '09181234567', email: 'jane@example.com' },
  { name: 'Alice Johnson', phoneNumber: '09191234567', email: 'alice@example.com' },
  { name: 'Bob Williams', phoneNumber: '09201234567', email: 'bob@example.com' },
  { name: 'Charlie Brown', phoneNumber: '09211234567', email: 'charlie@example.com' },
  { name: 'Emily Davis', phoneNumber: '09221234567', email: 'emily@example.com' },
  { name: 'Frank Miller', phoneNumber: '09231234567', email: 'frank@example.com' },
  { name: 'Grace Lee', phoneNumber: '09241234567', email: 'grace@example.com' },
  { name: 'Henry Moore', phoneNumber: '09251234567', email: 'henry@example.com' },
  { name: 'Isabella Young', phoneNumber: '09261234567', email: 'isabella@example.com' },
  { name: 'Mikael Estillore', phoneNumber: '09271234567', email: 'mikael@example.com' }
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
