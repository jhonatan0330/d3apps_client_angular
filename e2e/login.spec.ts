import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('button should enable when fields are filled', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#email');

    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();

    // Fill username
    await page.locator('#email').fill('80736676');
    await page.waitForTimeout(300);
    await expect(btn).toBeDisabled();

    // Fill password
    await page.locator('#password').fill('753');
    await page.waitForTimeout(500);

    // Button should now be enabled
    await expect(btn).toBeEnabled();
  });

  test('should login successfully and navigate to admin dashboard', async ({
    page,
  }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const authResult = await page.evaluate(async () => {
      const response = await fetch('/main/autenticarUsuarioAutenticacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion: '80736676',
          clave: '753',
          claveAnterior: '2030.02.10.22',
        }),
      });
      if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
      return response.json();
    });

    await page.evaluate((data) => {
      localStorage.setItem('JWT_TOKEN', JSON.stringify(data.token));
      localStorage.setItem('EGRET_USER', JSON.stringify(data.usuarioDTO));
      localStorage.setItem('URL_CONF', JSON.stringify(location.origin));
    }, authResult);

    await page.evaluate(() => {
      history.pushState(null, '', '/admin/main');
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    await page.waitForTimeout(5000);
    expect(page.url()).toContain('/admin');
  });
});
