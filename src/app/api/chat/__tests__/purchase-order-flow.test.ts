/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/chat/intents', () => ({
  analyzeIntent: jest.fn(),
}));

jest.mock('@/lib/services/chat/query-executor', () => ({
  executeQuery: jest.fn(),
}));

jest.mock('@/lib/services/chat/openai-client', () => ({
  formatResponse: jest.fn(),
}));

jest.mock('@/lib/audit/logger', () => ({
  logAudit: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    chatSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/utils/rate-limit', () => ({
  isRateLimited: jest.fn(() => false),
  createRateLimitResponse: jest.requireActual('@/lib/utils/rate-limit').createRateLimitResponse,
}));

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import prisma from '@/lib/db';

describe('POST /api/chat - Purchase Order Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-1', customerId: 'cust-1' });
    (formatResponse as jest.Mock).mockResolvedValue('Respuesta del bot');
    (prisma.chatSession.create as jest.Mock).mockResolvedValue({ sessionId: 'new-session', messages: [] });
    (prisma.chatSession.update as jest.Mock).mockResolvedValue({});
  });

  it('handles create_purchase_order flow: stores pending orders in context', async () => {
    // 1. Setup mocks for CREATE step
    (prisma.chatSession.findUnique as jest.Mock).mockResolvedValue({
      sessionId: 'session-123',
      userId: 'user-1',
      context: {},
      messages: []
    });

    (analyzeIntent as jest.Mock).mockResolvedValue({ 
      intent: 'create_purchase_order',
      confidence: 0.9 
    });

    const mockPendingOrders = [
      { supplierId: 's1', total: 100, items: [] }
    ];

    (executeQuery as jest.Mock).mockResolvedValue({
      intent: 'create_purchase_order',
      data: {
        type: 'create_purchase_order',
        created: false,
        pendingOrders: mockPendingOrders
      }
    });

    // 2. Execute Request
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'Comprar 100kg de manzanas', 
        sessionId: 'session-123' 
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);

    // 3. Verify Context Update
    expect(prisma.chatSession.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { sessionId: 'session-123' },
      data: expect.objectContaining({
        context: expect.objectContaining({
          pendingPurchaseOrders: mockPendingOrders
        })
      })
    }));
  });

  it('handles confirm_purchase_order flow: clears pending orders from context on success', async () => {
    // 1. Setup mocks for CONFIRM step
    // Context already has pending orders
    const existingContext = {
      pendingPurchaseOrders: [{ supplierId: 's1', total: 100 }]
    };

    (prisma.chatSession.findUnique as jest.Mock).mockResolvedValue({
      sessionId: 'session-123',
      userId: 'user-1',
      context: existingContext,
      messages: []
    });

    (analyzeIntent as jest.Mock).mockResolvedValue({ 
      intent: 'confirm_purchase_order',
      confidence: 0.95 
    });

    (executeQuery as jest.Mock).mockResolvedValue({
      intent: 'confirm_purchase_order',
      data: {
        type: 'confirm_purchase_order',
        success: true,
        createdOrders: [{ id: 'po-1', orderNumber: 'PO-2024-0001' }]
      }
    });

    // 2. Execute Request
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'Confirmar orden', 
        sessionId: 'session-123' 
      }),
    });

    const res = await POST(req);
    
    expect(res.status).toBe(200);

    // 3. Verify Context Update (removal of pendingPurchaseOrders)
    const updateCall = (prisma.chatSession.update as jest.Mock).mock.calls[0][0];
    const updatedContext = updateCall.data.context;
    
    expect(updatedContext.pendingPurchaseOrders).toBeUndefined();
  });
});
