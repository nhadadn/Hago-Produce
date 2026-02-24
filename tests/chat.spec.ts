import { test, expect } from '@playwright/test';

test.describe('Floating Chat Assistant', () => {
  test('should open chat and send a message', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if the chat button exists
    const chatButton = page.getByRole('button', { name: 'Abrir asistente' });
    await expect(chatButton).toBeVisible();

    // Click the chat button
    await chatButton.click();

    // Check if the chat window opens
    const chatWindow = page.locator('text=Hago Assistant');
    await expect(chatWindow).toBeVisible();

    // Mock the API response
    await page.route('**/api/chat', async (route) => {
      const json = {
        reply: 'Hola, soy el asistente virtual de prueba.',
        sessionId: 'test-session-e2e',
      };
      await route.fulfill({ json });
    });

    // Type a message
    const input = page.getByPlaceholder(/escribe tu mensaje/i);
    await input.fill('Hola E2E');
    await page.keyboard.press('Enter');

    // Verify the user message appears
    await expect(page.locator('text=Hola E2E')).toBeVisible();

    // Wait for response
    await expect(page.locator('text=Hola, soy el asistente virtual de prueba.')).toBeVisible();
  });

  test('should show and use quick suggestions', async ({ page }) => {
    await page.goto('/dashboard'); // Assuming dashboard route triggers specific suggestions
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Abrir asistente' }).click();

    // Check for suggestions (e.g., "Reporte Ventas")
    // Note: Depends on what getSuggestionsForRoute returns for '/dashboard'
    // Based on code: "Reporte Ventas", "Crear Factura", "Clientes Activos"
    const suggestion = page.getByText('Reporte Ventas');
    await expect(suggestion).toBeVisible();

    // Mock API
    await page.route('**/api/chat', async (route) => {
        await route.fulfill({ json: { reply: 'Aquí está el reporte.', sessionId: 'suggestion-session' } });
    });

    // Click suggestion
    await suggestion.click();

    // Verify mapped message is sent
    await expect(page.locator('text=Muéstrame el reporte de ventas de hoy')).toBeVisible();
    await expect(page.locator('text=Aquí está el reporte.')).toBeVisible();
  });

  test('should persist chat history and support multiple sessions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mock API
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        json: {
          reply: 'Respuesta persistente',
          sessionId: 'persist-session',
        }
      });
    });

    // 1. Send message
    await page.getByRole('button', { name: 'Abrir asistente' }).click();
    await page.getByPlaceholder(/escribe tu mensaje/i).fill('Mensaje persistente');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Respuesta persistente')).toBeVisible();

    // 2. Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Abrir asistente' }).click();

    // 3. Verify history is there
    await expect(page.locator('text=Mensaje persistente')).toBeVisible();

    // 4. Create new session via History view
    await page.getByTitle('Ver historial').click();
    await expect(page.locator('text=Historial')).toBeVisible();
    // Check if the previous chat is listed
    await expect(page.locator('text=Mensaje persistente')).toBeVisible();

    await page.getByTitle('Nueva conversación').click();
    
    // Should be back to main view and empty
    await expect(page.locator('text=Hago Assistant')).toBeVisible();
    await expect(page.locator('text=Mensaje persistente')).not.toBeVisible();
  });
});
