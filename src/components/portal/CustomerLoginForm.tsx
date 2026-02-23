'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function CustomerLoginForm() {
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useCustomerAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tax_id: taxId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Error al iniciar sesión');
      }

      login(data.data.access_token, {
        id: data.data.customer.id,
        companyName: data.data.customer.company_name,
        taxId: data.data.customer.tax_id,
      });

      router.push('/portal/customer/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Portal de Clientes</CardTitle>
        <CardDescription>Ingresa tu Tax ID y contraseña.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

