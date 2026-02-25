
import { CommandHandler } from '@/lib/services/bot/command-handler.service';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    customer: { count: jest.fn() },
    invoice: { count: jest.fn(), aggregate: jest.fn() },
    product: { count: jest.fn() },
    supplier: { count: jest.fn() },
  },
}));

describe('CommandHandler Service', () => {
  let handler: CommandHandler;

  beforeEach(() => {
    handler = new CommandHandler();
    jest.clearAllMocks();
  });

  describe('isCommand', () => {
    it('should detect slash commands', () => {
      expect(handler.isCommand('/start')).toEqual({ isCommand: true, command: 'start', args: undefined });
      expect(handler.isCommand('/help')).toEqual({ isCommand: true, command: 'help', args: undefined });
    });

    it('should detect slash commands with arguments', () => {
      expect(handler.isCommand('/search ABC')).toEqual({ isCommand: true, command: 'search', args: 'ABC' });
      expect(handler.isCommand('/cmd arg1 arg2')).toEqual({ isCommand: true, command: 'cmd', args: 'arg1 arg2' });
    });

    it('should detect WhatsApp style commands', () => {
      expect(handler.isCommand('start')).toEqual({ isCommand: true, command: 'start', args: undefined });
      expect(handler.isCommand('Ayuda')).toEqual({ isCommand: true, command: 'ayuda', args: undefined });
      expect(handler.isCommand('Hola')).toEqual({ isCommand: true, command: 'hola', args: undefined });
    });

    it('should return false for non-commands', () => {
      expect(handler.isCommand('Hello world')).toEqual({ isCommand: false });
      expect(handler.isCommand('How are you?')).toEqual({ isCommand: false });
    });
  });

  describe('detectLanguage', () => {
    it('should detect Spanish', () => {
      expect(handler.detectLanguage('Hola, necesito ayuda con una factura')).toBe('es');
      expect(handler.detectLanguage('cuánto saldo tengo?')).toBe('es');
    });

    it('should detect English', () => {
      expect(handler.detectLanguage('Hello, I need help with an invoice')).toBe('en');
      expect(handler.detectLanguage('how much balance?')).toBe('en');
    });

    it('should default to Spanish if more spanish words or equal', () => {
      expect(handler.detectLanguage('random text')).toBe('es');
    });
  });

  describe('handleCommand', () => {
    describe('start command', () => {
      it('should return start message in Spanish', async () => {
        const result = await handler.handleCommand('start', 'es');
        expect(result.intent).toBe('command_start');
        expect(result.response).toContain('¡Hola! Soy el bot de Hago Produce');
      });

      it('should return start message in English', async () => {
        const result = await handler.handleCommand('start', 'en');
        expect(result.intent).toBe('command_start');
        expect(result.response).toContain('Hello! I am the Hago Produce bot');
      });
    });

    describe('help command', () => {
      it('should return help message in Spanish', async () => {
        const result = await handler.handleCommand('help', 'es');
        expect(result.intent).toBe('command_help');
        expect(result.response).toContain('Comandos disponibles');
      });

      it('should return help message in English', async () => {
        const result = await handler.handleCommand('help', 'en');
        expect(result.intent).toBe('command_help');
        expect(result.response).toContain('Available commands');
      });
    });

    describe('status command', () => {
      beforeEach(() => {
        (prisma.customer.count as jest.Mock).mockResolvedValue(10);
        (prisma.invoice.count as jest.Mock).mockResolvedValue(50);
        (prisma.product.count as jest.Mock).mockResolvedValue(100);
        (prisma.supplier.count as jest.Mock).mockResolvedValue(5);
        (prisma.invoice.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 5000 } });
      });

      it('should return system status in Spanish', async () => {
        const result = await handler.handleCommand('status', 'es');
        
        expect(result.intent).toBe('command_status');
        expect(result.response).toContain('Estado del sistema Hago Produce');
        expect(result.response).toContain('Clientes:* 10');
        expect(result.response).toContain('Facturas:* 50');
        expect(result.response).toContain('Ingresos:* $5000');
        
        expect(prisma.customer.count).toHaveBeenCalled();
        expect(prisma.invoice.count).toHaveBeenCalledTimes(2); // Total and pending
      });

      it('should return system status in English', async () => {
        const result = await handler.handleCommand('status', 'en');
        
        expect(result.intent).toBe('command_status');
        expect(result.response).toContain('Hago Produce System Status');
        expect(result.response).toContain('Customers:* 10');
      });

      it('should handle database errors', async () => {
        (prisma.customer.count as jest.Mock).mockRejectedValue(new Error('DB Error'));
        
        const result = await handler.handleCommand('status', 'es');
        
        expect(result.intent).toBe('command_status_error');
        expect(result.response).toContain('Error al obtener estado del sistema');
      });
      
      it('should handle database errors in English', async () => {
        (prisma.customer.count as jest.Mock).mockRejectedValue(new Error('DB Error'));
        
        const result = await handler.handleCommand('status', 'en');
        
        expect(result.intent).toBe('command_status_error');
        expect(result.response).toContain('Error getting system status');
      });
    });

    describe('unknown command', () => {
      it('should return unknown command message in Spanish', async () => {
        const result = await handler.handleCommand('xyz', 'es');
        expect(result.intent).toBe('command_unknown');
        expect(result.response).toContain('Comando desconocido: /xyz');
      });

      it('should return unknown command message in English', async () => {
        const result = await handler.handleCommand('xyz', 'en');
        expect(result.intent).toBe('command_unknown');
        expect(result.response).toContain('Unknown command: /xyz');
      });
    });
  });
});
