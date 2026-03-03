/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductAutocomplete } from '../ProductAutocomplete';
import { Product } from '@prisma/client';

// Mock ResizeObserver for Popover/Command
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for Command
Element.prototype.scrollIntoView = jest.fn();

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Producto Uno',
    sku: 'SKU001',
    nameEs: null,
    description: null,
    category: null,
    unit: 'unit',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: '2',
    name: 'Producto Dos',
    sku: 'SKU002',
    nameEs: null,
    description: null,
    category: null,
    unit: 'unit',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: '3',
    name: 'Manzana Gala',
    sku: 'FRUT001',
    nameEs: null,
    description: null,
    category: null,
    unit: 'kg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

describe('ProductAutocomplete', () => {
  it('renders correctly', () => {
    render(<ProductAutocomplete products={mockProducts} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Seleccionar producto');
  });

  it('opens and displays products', async () => {
    const user = userEvent.setup();
    render(<ProductAutocomplete products={mockProducts} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('Producto Uno')).toBeInTheDocument();
    expect(screen.getByText('Producto Dos')).toBeInTheDocument();
  });

  it('filters products by name (case insensitive)', async () => {
    const user = userEvent.setup();
    render(<ProductAutocomplete products={mockProducts} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o SKU...');
    await user.type(searchInput, 'dos');
    
    expect(screen.getByText('Producto Dos')).toBeInTheDocument();
    expect(screen.queryByText('Producto Uno')).not.toBeInTheDocument();
  });

  it('filters products by SKU', async () => {
    const user = userEvent.setup();
    render(<ProductAutocomplete products={mockProducts} onChange={() => {}} />);
    
    await user.click(screen.getByRole('combobox'));
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o SKU...');
    await user.type(searchInput, 'SKU001');
    
    expect(screen.getByText('Producto Uno')).toBeInTheDocument();
  });

  it('selects a product and calls onChange', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ProductAutocomplete products={mockProducts} onChange={onChange} />);
    
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Producto Uno'));
    
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('displays selected product name', () => {
    render(
      <ProductAutocomplete 
        products={mockProducts} 
        value="2" 
        onChange={() => {}} 
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Producto Dos (SKU002)');
  });
});
