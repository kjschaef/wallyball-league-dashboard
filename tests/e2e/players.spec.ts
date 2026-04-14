import { test, expect } from '@playwright/test';

test.describe('Players Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to players
    await page.goto('/players', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should render the Players page and allow interactions', async ({ page }) => {
    // Expect header
    await expect(page.getByRole('heading', { name: 'Players', exact: true })).toBeVisible();

    // Check for add player button
    const addPlayerBtn = page.getByRole('button', { name: 'Add Player' });
    await expect(addPlayerBtn).toBeVisible();

    // Click Add Player to open modal
    await addPlayerBtn.click();
    
    // Expect add player dialog
    const modalHeading = page.getByRole('heading', { name: 'Add New Player' });
    await expect(modalHeading).toBeVisible();

    // Ensure form inputs are present
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Start Year (optional)')).toBeVisible();

    // Type a test player name
    await page.getByLabel('Name').fill('Test Player E2E');
    
    // Click Add Player inside modal
    await page.getByRole('button', { name: 'Add Player', exact: true }).nth(1).click();

    // Should prompt for Admin login since we are not authenticated
    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();

    // Cancel admin modal
    await page.locator('.z-\\[60\\]').getByRole('button', { name: 'Cancel' }).click();
  });
});
