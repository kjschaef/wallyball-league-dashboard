import { test, expect } from '@playwright/test';

test.describe('Players Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to players
    await page.goto('/players');
  });

  test('should add, search, edit, and delete a player with admin authentication', async ({ page }) => {
    const testPlayerName = 'E2E Player ' + Date.now();
    const updatedPlayerName = testPlayerName + ' (Updated)';

    // 1. Add Player
    const addPlayerBtn = page.getByRole('button', { name: 'Add Player' }).first();
    await addPlayerBtn.click();

    const modalHeading = page.getByRole('heading', { name: 'Add New Player' });
    await expect(modalHeading).toBeVisible();

    await page.getByLabel('Name').fill(testPlayerName);
    await page.getByLabel('Start Year (optional)').fill('2024');

    // Click submit in modal
    await page.getByRole('button', { name: 'Add Player', exact: true }).nth(1).click();

    // Authenticate with admin password
    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();
    await page.getByPlaceholder('Enter admin password').fill('admin123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify modal closes and new player appears in grid
    await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: testPlayerName })).toBeVisible({ timeout: 10000 });

    // 2. Search / Filter Players
    const searchInput = page.getByPlaceholder('Search players...');
    await searchInput.fill(testPlayerName);
    await expect(page.getByRole('heading', { name: testPlayerName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alice', exact: true })).not.toBeVisible();

    // Clear search filter
    await searchInput.fill('');
    await expect(page.getByRole('heading', { name: 'Alice', exact: true })).toBeVisible();

    // 3. Edit Player
    const playerCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: testPlayerName });
    await playerCard.getByLabel('Edit player').click();

    const editHeading = page.getByRole('heading', { name: 'Edit Player' });
    await expect(editHeading).toBeVisible();

    const editForm = page.locator('form');
    await editForm.getByLabel('Name').fill(updatedPlayerName);
    await editForm.getByRole('button', { name: 'Update' }).click();

    // If prompted for admin, fill password; otherwise it passes with existing cookie
    if (await adminHeading.isVisible()) {
      await page.getByPlaceholder('Enter admin password').fill('admin123');
      await page.getByRole('button', { name: 'Submit' }).click();
    }

    await expect(editHeading).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: updatedPlayerName })).toBeVisible({ timeout: 10000 });

    // 4. Delete Player
    const updatedCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: updatedPlayerName });
    await updatedCard.getByLabel('Delete player').click();

    // Confirm deletion dialog
    const deleteHeading = page.getByRole('heading', { name: 'Delete Player' });
    await expect(deleteHeading).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // If prompted for admin, fill password
    if (await adminHeading.isVisible()) {
      await page.getByPlaceholder('Enter admin password').fill('admin123');
      await page.getByRole('button', { name: 'Submit' }).click();
    }

    // Verify player is removed from the grid
    await expect(page.getByRole('heading', { name: updatedPlayerName })).not.toBeVisible({ timeout: 10000 });
  });

  test('should prompt for admin and allow cancellation when unauthenticated', async ({ page }) => {
    const addPlayerBtn = page.getByRole('button', { name: 'Add Player' }).first();
    await addPlayerBtn.click();

    const modalHeading = page.getByRole('heading', { name: 'Add New Player' });
    await expect(modalHeading).toBeVisible();

    await page.getByLabel('Name').fill('Test Cancel Player');
    await page.getByRole('button', { name: 'Add Player', exact: true }).nth(1).click();

    const adminHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(adminHeading).toBeVisible();

    // Cancel admin modal
    await page.locator('.z-\\[60\\]').getByRole('button', { name: 'Cancel' }).click();
    await expect(adminHeading).not.toBeVisible();
  });
});
