import { test, expect } from '@playwright/test';

test.describe('Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should edit schedule settings and save successfully with admin authentication', async ({ page }) => {
    // Expect header
    await expect(page.getByRole('heading', { name: 'Site Settings' })).toBeVisible();

    // Check for sections
    await expect(page.getByRole('heading', { name: 'Signup Configuration' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Controls' })).toBeVisible();

    // 1. Toggle an available day (e.g. Wednesday)
    const wednesdayBtn = page.getByRole('button', { name: 'Wednesday' });
    await expect(wednesdayBtn).toBeVisible();
    await wednesdayBtn.click();

    // 2. Adjust open/close time
    const openTimeInput = page.getByLabel('Signups Open Time (EST)');
    await openTimeInput.fill('11:00');

    // 3. Save Settings
    const saveButton = page.getByRole('button', { name: 'Save All Settings' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 4. Admin authentication modal appears
    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();

    // 5. Submit valid admin credentials
    await page.getByPlaceholder('Enter admin password').fill('admin123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 6. Verify success notification
    await expect(page.getByText('Settings saved successfully!')).toBeVisible({ timeout: 10000 });
  });

  test('should show error when saving settings with invalid password', async ({ page }) => {
    // Click Save Config and expect Admin Login Modal
    const saveButton = page.getByRole('button', { name: 'Save All Settings' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();

    // Enter wrong password
    await page.getByPlaceholder('Enter admin password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify error message
    await expect(page.getByText('Invalid password')).toBeVisible({ timeout: 10000 });
  });
});
