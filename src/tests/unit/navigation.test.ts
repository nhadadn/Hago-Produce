import { navigation } from '@/config/navigation';
import { Role } from '@prisma/client';

describe('Navigation Config', () => {
  it('should have items for ADMIN', () => {
    const adminItems = navigation.filter(item => item.roles.includes(Role.ADMIN));
    expect(adminItems.length).toBeGreaterThan(0);
    expect(adminItems.find(i => i.href === '/users')).toBeDefined();
  });

  it('should have items for CUSTOMER', () => {
    const customerItems = navigation.filter(item => item.roles.includes(Role.CUSTOMER));
    expect(customerItems.length).toBeGreaterThan(0);
    expect(customerItems.find(i => i.href === '/dashboard')).toBeDefined();
    expect(customerItems.find(i => i.href === '/users')).toBeUndefined();
  });
});
