
import { Role } from '@prisma/client';

console.log('Role enum:', Role);

if (Role.ADMIN === 'ADMIN') {
  console.log('Role.ADMIN is correct');
} else {
  console.log('Role.ADMIN is incorrect:', Role.ADMIN);
}
