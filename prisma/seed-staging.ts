import { PrismaClient, Role, InvoiceStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting staging seed...');

  // 1. Create Customers & Users
  const customersData = [
    { name: 'Frutería La Central', taxId: '3-101-123456', email: 'contacto@lacentral.com' },
    { name: 'Supermercado El Sol', taxId: '3-101-654321', email: 'compras@elsol.com' },
    { name: 'Restaurante Sabor Tico', taxId: '3-101-987654', email: 'admin@sabortico.com' },
  ];

  const customers = [];
  for (const cData of customersData) {
    let customer = await prisma.customer.findUnique({ where: { taxId: cData.taxId } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: cData.name,
          taxId: cData.taxId,
          email: cData.email,
          address: 'San José, Costa Rica',
          phone: '+506 2222-3333',
        },
      });
      console.log(`Created customer: ${customer.name}`);
    } else {
      console.log(`Customer already exists: ${customer.name}`);
    }
    customers.push(customer);

    // Create User for Customer
    const userEmail = cData.email;
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!existingUser) {
      const hashedPassword = await hash('password123', 10);
      await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: cData.name.split(' ')[0],
          role: Role.CUSTOMER,
          customerId: customer.id,
        },
      });
      console.log(`Created user for customer: ${userEmail}`);
    }
  }

  // 2. Create Products
  // Create a dummy supplier for prices
  let supplier = await prisma.supplier.findUnique({ where: { name: 'Proveedor General' } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: 'Proveedor General',
        contactName: 'Juan Perez',
        email: 'proveedor@general.com',
        phone: '+506 8888-8888',
      },
    });
    console.log('Created dummy supplier for product prices');
  }

  const productsData = [
    { name: 'Manzanas Gala', sku: 'FRU-001', price: 1.50, unit: 'kg' },
    { name: 'Bananos Criollos', sku: 'FRU-002', price: 0.80, unit: 'kg' },
    { name: 'Piña Dorada', sku: 'FRU-003', price: 2.00, unit: 'unidad' },
    { name: 'Fresas Premium', sku: 'FRU-004', price: 3.50, unit: 'kg' },
    { name: 'Uvas Sin Semilla', sku: 'FRU-005', price: 4.00, unit: 'kg' },
    { name: 'Naranjas Valencia', sku: 'FRU-006', price: 1.20, unit: 'kg' },
    { name: 'Sandía Rayada', sku: 'FRU-007', price: 0.90, unit: 'kg' },
    { name: 'Melón Cantaloupe', sku: 'FRU-008', price: 1.80, unit: 'unidad' },
    { name: 'Papaya Pococí', sku: 'FRU-009', price: 1.10, unit: 'kg' },
    { name: 'Mango Tommy', sku: 'FRU-010', price: 1.75, unit: 'kg' },
  ];

  const products = [];
  for (const pData of productsData) {
    let product = await prisma.product.findUnique({ where: { sku: pData.sku } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: pData.name,
          sku: pData.sku,
          description: `Producto fresco: ${pData.name}`,
          category: 'Frutas',
          unit: pData.unit,
        },
      });
      console.log(`Created product: ${product.name}`);
    } else {
      console.log(`Product already exists: ${product.name}`);
    }
    
    // Create or update price
    if (supplier) {
        const existingPrice = await prisma.productPrice.findFirst({
            where: {
                productId: product.id,
                supplierId: supplier.id,
                isCurrent: true
            }
        });

        if (!existingPrice) {
            await prisma.productPrice.create({
                data: {
                    productId: product.id,
                    supplierId: supplier.id,
                    costPrice: pData.price * 0.7, // 30% margin
                    sellPrice: pData.price,
                    currency: 'USD',
                    isCurrent: true,
                    source: 'seed-staging'
                }
            });
        }
    }
    
    products.push({ ...product, price: pData.price });
  }

  // 3. Create Invoices
  // Check if we already have enough invoices to avoid over-seeding
  const invoiceCount = await prisma.invoice.count();
  if (invoiceCount >= 20) {
    console.log('Invoices already seeded (count >= 20). Skipping invoice creation.');
  } else {
    console.log('Seeding 20 demo invoices...');
    
    for (let i = 1; i <= 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
      const selectedProducts = [];
      
      // Select random unique products
      const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
      const itemsToCreate = shuffledProducts.slice(0, numItems);

      let subtotal = 0;
      const invoiceItemsData = itemsToCreate.map((p) => {
        const quantity = Math.floor(Math.random() * 20) + 1;
        const total = quantity * p.price;
        subtotal += total;
        return {
          productId: p.id,
          description: p.name,
          quantity: quantity,
          unitPrice: p.price,
          totalPrice: total,
        };
      });

      const taxRate = 0.13;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      
      // Determine status based on random logic or index
      const statuses = Object.values(InvoiceStatus);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Dates
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30)); // Past 30 days
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // Net 30

      const invoiceNumber = `INV-STG-${2026}-${String(i + invoiceCount).padStart(4, '0')}`;

      await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          customerId: customer.id,
          status: status,
          issueDate: issueDate,
          dueDate: dueDate,
          subtotal: subtotal,
          taxRate: taxRate,
          taxAmount: taxAmount,
          total: total,
          items: {
            create: invoiceItemsData,
          },
        },
      });
      console.log(`Created invoice: ${invoiceNumber}`);
    }
  }

  console.log('Staging seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
