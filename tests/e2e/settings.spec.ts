import { test, expect } from '@playwright/test';

test.describe('Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should render Site Settings and attempt to save without password', async ({ page }) => {
    // Expect header
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Check for sections
    await expect(page.getByRole('heading', { name: 'Signup Configuration' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Controls' })).toBeVisible();

    const saveButton = page.getByRole('button', { name: 'Save All Settings' });
    await expect(saveButton).toBeVisible();

    // Click Save Config and expect Admin Login Modal because no password is provided/stored in session yet
    await saveButton.click();
    
    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();

    // Enter wrong password
    await page.getByPlaceholder('Enter admin password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify error message
    // "Invalid password" string is expected from the mock auth endpoint
    await expect(page.getByText('Invalid password')).toBeVisible({ timeout: 10000 });
  });
});
