/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerSelect } from '../CustomerSelect';
import { Customer } from '@prisma/client';

// Mock ResizeObserver for Popover/Command
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for Command
Element.prototype.scrollIntoView = jest.fn();

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Cliente Uno',
    email: 'uno@example.com',
    phone: null,
    address: null,
    taxId: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    telegramChatId: null,
    preferredChannel: null,
  },
  {
    id: '2',
    name: 'Cliente Dos',
    email: 'dos@example.com',
    phone: null,
    address: null,
    taxId: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    telegramChatId: null,
    preferredChannel: null,
  },
  {
    id: '3',
    name: 'Ángel Pérez', // Name with accent
    email: 'angel@example.com',
    phone: null,
    address: null,
    taxId: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    telegramChatId: null,
    preferredChannel: null,
  },
];

describe('CustomerSelect', () => {
  it('renders correctly', () => {
    render(<CustomerSelect customers={mockCustomers} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Seleccionar cliente');
  });

  it('opens and displays customers', async () => {
    const user = userEvent.setup();
    render(<CustomerSelect customers={mockCustomers} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
    expect(screen.getByText('Cliente Dos')).toBeInTheDocument();
  });

  it('filters customers (case insensitive)', async () => {
    const user = userEvent.setup();
    render(<CustomerSelect customers={mockCustomers} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText('Buscar cliente...');
    await user.type(searchInput, 'uno');
    
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
    expect(screen.queryByText('Cliente Dos')).not.toBeInTheDocument();
  });

  it('filters customers (accent insensitive)', async () => {
    const user = userEvent.setup();
    render(<CustomerSelect customers={mockCustomers} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    const searchInput = screen.getByPlaceholderText('Buscar cliente...');
    // Type "Angel" without accent, should find "Ángel"
    await user.type(searchInput, 'Angel');
    
    expect(screen.getByText('Ángel Pérez')).toBeInTheDocument();
  });

  it('selects a customer and calls onChange', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<CustomerSelect customers={mockCustomers} onChange={onChange} />);
    
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Cliente Uno'));
    
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('displays selected customer name', () => {
    render(
      <CustomerSelect 
        customers={mockCustomers} 
        value="2" 
        onChange={() => {}} 
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Cliente Dos');
  });
});
