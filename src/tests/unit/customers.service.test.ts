import { CustomerService } from '@/lib/services/customers.service';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  customer: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1', taxId: 'TAX1' },
        { id: '2', name: 'Customer 2', taxId: 'TAX2' },
      ];
      const mockCount = 2;

      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
      (prisma.customer.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await CustomerService.getAll({ page: 1, limit: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }));
      expect(result).toEqual({
        data: mockCustomers,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should apply filters (isActive boolean)', async () => {
      const mockCustomers = [{ id: '1', name: 'Customer 1', isActive: true }];
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
      (prisma.customer.count as jest.Mock).mockResolvedValue(1);

      await CustomerService.getAll({ isActive: true });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
        }),
      }));
    });

    it('should apply filters (isActive string)', async () => {
        const mockCustomers = [{ id: '1', name: 'Customer 1', isActive: true }];
        (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
        (prisma.customer.count as jest.Mock).mockResolvedValue(1);
  
        // @ts-ignore - simulating query param which might be string
        await CustomerService.getAll({ isActive: 'true' });
  
        expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }));
      });

    it('should apply search filter', async () => {
        const mockCustomers = [{ id: '1', name: 'Search Match' }];
        (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
        (prisma.customer.count as jest.Mock).mockResolvedValue(1);
  
        await CustomerService.getAll({ search: 'query' });
  
        expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'query', mode: 'insensitive' } },
              { taxId: { contains: 'query', mode: 'insensitive' } },
              { email: { contains: 'query', mode: 'insensitive' } },
            ]),
          }),
        }));
      });
  });

  describe('getById', () => {
    it('should return customer by id', async () => {
      const mockCustomer = { id: '1', name: 'Customer 1' };
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const result = await CustomerService.getById('1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('getByTaxId', () => {
    it('should return customer by taxId', async () => {
      const mockCustomer = { id: '1', taxId: 'TAX1' };
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const result = await CustomerService.getByTaxId('TAX1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({ where: { taxId: 'TAX1' } });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('create', () => {
    it('should create a customer if taxId is unique', async () => {
      const data = {
        name: 'New Customer',
        taxId: 'NEWTAX',
        email: 'new@example.com',
        phone: '1234567890',
        address: '123 St',
        isActive: true
      };
      
      // Mock getByTaxId -> null
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.customer.create as jest.Mock).mockResolvedValue({ id: '1', ...data });
      // Mock user create for transaction
      (prisma as any).user = { create: jest.fn().mockResolvedValue({}) };

      const result = await CustomerService.create(data);

      expect(prisma.customer.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual({ id: '1', ...data });
    });

    it('should throw error if taxId already exists', async () => {
        const data = {
            name: 'New Customer',
            taxId: 'EXISTING',
            email: 'new@example.com',
            phone: '1234567890',
            address: '123 St',
            isActive: true
          };
      
      // Mock getByTaxId -> existing customer
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '2', taxId: 'EXISTING' });

      await expect(CustomerService.create(data)).rejects.toThrow('Customer with Tax ID EXISTING already exists');
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const updateData = { name: 'Updated Name' };
      (prisma.customer.update as jest.Mock).mockResolvedValue({ id: '1', ...updateData });

      const result = await CustomerService.update('1', updateData);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toEqual({ id: '1', ...updateData });
    });

    it('should check for taxId conflict on update', async () => {
        const updateData = { taxId: 'CONFLICT' };
        // Mock existing customer with this taxId but different ID
        (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '2', taxId: 'CONFLICT' });
  
        await expect(CustomerService.update('1', updateData)).rejects.toThrow('Customer with Tax ID CONFLICT already exists');
        expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it('should allow update if taxId belongs to same customer', async () => {
        const updateData = { taxId: 'SAME' };
        // Mock existing customer with this taxId AND same ID
        (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '1', taxId: 'SAME' });
        (prisma.customer.update as jest.Mock).mockResolvedValue({ id: '1', ...updateData });
  
        await CustomerService.update('1', updateData);
        
        expect(prisma.customer.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete customer', async () => {
      (prisma.customer.update as jest.Mock).mockResolvedValue({ id: '1', isActive: false });

      await CustomerService.delete('1');

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });
});
