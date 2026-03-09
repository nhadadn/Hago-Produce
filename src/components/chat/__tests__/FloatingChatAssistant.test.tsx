/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FloatingChatAssistant } from '../FloatingChatAssistant';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('FloatingChatAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Respuesta del bot',
        sessionId: 'test-session-id',
      }),
    });
  });

  it('renders closed by default', () => {
    render(<FloatingChatAssistant />);
    expect(screen.queryByText('Hago Assistant')).not.toBeInTheDocument();
    const openButton = screen.getByRole('button', { name: /abrir asistente/i });
    expect(openButton).toBeInTheDocument();
  });

  it('opens chat when toggle button is clicked', () => {
    render(<FloatingChatAssistant />);
    const openButton = screen.getByRole('button', { name: /abrir asistente/i });
    
    fireEvent.click(openButton);

    expect(screen.getByText('Hago Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/escribe tu mensaje/i)).toBeInTheDocument();
  });

  it('sends a message and displays response', async () => {
    render(<FloatingChatAssistant initialOpen={true} />);
    
    const input = screen.getByPlaceholderText(/escribe tu mensaje/i);
    const sendButton = screen.getByRole('button', { name: /enviar mensaje/i });
    
    // Type message
    fireEvent.change(input, { target: { value: 'Hola mundo' } });
    
    // Send
    fireEvent.click(sendButton);

    // Check user message appears immediately
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    
    // Check API call
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"message":"Hola mundo"'),
      headers: expect.objectContaining({
        'Authorization': 'Bearer fake-token'
      })
    }));

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Respuesta del bot')).toBeInTheDocument();
    });
  });

  it('displays quick suggestions based on route', async () => {
    render(<FloatingChatAssistant initialOpen={true} />);
    
    // Wait for suggestions to appear (after useEffect)
    // "Reporte Ventas" is a dashboard suggestion
    const suggestion = await screen.findByText('Reporte Ventas');
    expect(suggestion).toBeInTheDocument();
    expect(screen.getByText('Crear Factura')).toBeInTheDocument();
  });

  it('sends message when clicking a suggestion', async () => {
    render(<FloatingChatAssistant initialOpen={true} />);
    
    const suggestion = await screen.findByText('Reporte Ventas');
    fireEvent.click(suggestion);

    // Verify it sends the mapped action text
    // "Reporte Ventas" maps to "Muéstrame el reporte de ventas de hoy"
    await waitFor(() => {
        expect(screen.getByText('Muéstrame el reporte de ventas de hoy')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('switches to history view', async () => {
    render(<FloatingChatAssistant initialOpen={true} />);
    
    // Create some history first by sending a message
    const input = screen.getByPlaceholderText(/escribe tu mensaje/i);
    const sendButton = screen.getByRole('button', { name: /enviar mensaje/i });
    
    fireEvent.change(input, { target: { value: 'Test Msg' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => screen.getByText('Respuesta del bot'));

    // Click History button
    const historyButton = screen.getByTitle('Ver historial');
    fireEvent.click(historyButton);

    expect(screen.getByText('Historial')).toBeInTheDocument();
    // Use findByText because sessions update in useEffect
    expect(await screen.findByText(/Test Msg/)).toBeInTheDocument(); 
  });

  it('creates new chat session', async () => {
    render(<FloatingChatAssistant initialOpen={true} />);
    
    // Go to history
    const historyButton = screen.getByTitle('Ver historial');
    fireEvent.click(historyButton);

    // Click New Chat
    const newChatButton = screen.getByTitle('Nueva conversación');
    fireEvent.click(newChatButton);

    expect(screen.getByText('Hago Assistant')).toBeInTheDocument();
    // Should be empty (except welcome message if any)
    expect(screen.queryByText('Test Msg')).not.toBeInTheDocument();
  });
});
