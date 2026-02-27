import { BotDecisionService } from '@/lib/services/bot-decision.service';
jest.unmock('@/lib/db');
const { default: prisma } = jest.requireActual('@/lib/db');
import { BotDecisionPayload } from '@/lib/types/bot-decision.types';

describe('BotDecisionService Integration', () => {
  let service: BotDecisionService;
  let testUser: any;
  let testSession: any;

  beforeAll(async () => {
    service = new BotDecisionService();
    // Create a user for chat sessions
    testUser = await prisma.user.create({
      data: {
        email: `test-bot-decision-${Date.now()}@example.com`,
        password: 'password123',
        role: 'CUSTOMER'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
        // Delete related sessions first
        await prisma.chatSession.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
     // Create a fresh session for each test
     testSession = await prisma.chatSession.create({
        data: {
            userId: testUser.id,
            sessionId: `sess-${Date.now()}-${Math.random()}`
        }
     });
  });

  it('should save 3 decisions and retrieve them', async () => {
    const payload: BotDecisionPayload = { action: 'test' };
    await service.saveDecision(testSession.id, 'intent1', 0.9, payload);
    await service.saveDecision(testSession.id, 'intent2', 0.8, payload);
    await service.saveDecision(testSession.id, 'intent3', 0.7, payload);

    const decisions = await service.getDecisionsBySession(testSession.id);
    expect(decisions).toHaveLength(3);
  });

  it('should retrieve decisions ordered by executedAt DESC', async () => {
     const payload: BotDecisionPayload = { action: 'test' };
     // Force delay to ensure timestamp difference if DB resolution is low
     await service.saveDecision(testSession.id, 'first', 0.9, payload);
     await new Promise(r => setTimeout(r, 10)); 
     await service.saveDecision(testSession.id, 'second', 0.9, payload);
     await new Promise(r => setTimeout(r, 10));
     await service.saveDecision(testSession.id, 'third', 0.9, payload);

     const decisions = await service.getDecisionsBySession(testSession.id);
     expect(decisions[0].intent).toBe('third');
     expect(decisions[1].intent).toBe('second');
     expect(decisions[2].intent).toBe('first');
  });

  it('should persist multiple decisions for the same session (immutability)', async () => {
    const payload: BotDecisionPayload = { action: 'test' };
    const d1 = await service.saveDecision(testSession.id, 'duplicate', 0.5, payload);
    const d2 = await service.saveDecision(testSession.id, 'duplicate', 0.5, payload);

    expect(d1.id).not.toBe(d2.id);
    const decisions = await service.getDecisionsBySession(testSession.id);
    expect(decisions.filter(d => d.intent === 'duplicate')).toHaveLength(2);
  });

  it('should cap recent decisions at 100', async () => {
     // Create 105 decisions
     // Use a loop but be careful with async/await in loops or use Promise.all
     // We use a new session to avoid polluting others excessively, though beforeEach creates one.
     // We can use the current testSession.
     
     const promises = [];
     for(let i=0; i<105; i++) {
        promises.push(service.saveDecision(testSession.id, `intent-mass-${i}`, 0.5, { index: i }));
     }
     await Promise.all(promises);

     const recent = await service.getRecentDecisions(200);
     expect(recent.length).toBeLessThanOrEqual(100);
     // If the DB was clean, it should be 100. If other tests ran, still max 100.
     // Since we inserted 105, we expect exactly 100.
     expect(recent.length).toBe(100);
  });

  it('should link a PreInvoice correctly', async () => {
    // Create a dummy customer and PreInvoice
    const customer = await prisma.customer.create({
        data: {
            name: 'Test Customer Integration',
            taxId: `TAX-${Date.now()}-${Math.random()}`,
        }
    });

    const preInvoice = await prisma.preInvoice.create({
        data: {
            customerId: customer.id,
            subtotal: 100,
            taxRate: 0.16,
            taxAmount: 16,
            total: 116,
            status: 'DRAFT'
        }
    });

    const decision = await service.saveDecision(testSession.id, 'create_invoice', 0.95, {}, preInvoice.id);
    
    // Verify connection from PreInvoice side
    const updatedPreInvoice = await prisma.preInvoice.findUnique({ where: { id: preInvoice.id } });
    expect(updatedPreInvoice?.botDecisionId).toBe(decision.id);

    // Cleanup
    await prisma.preInvoice.delete({ where: { id: preInvoice.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

});
