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

    const editModal = page.locator('.fixed.inset-0').filter({ hasText: 'Edit Player' });
    await expect(editModal).toBeVisible();
    await editModal.getByLabel('Name').fill(updatedPlayerName);
    await editModal.getByRole('button', { name: 'Update Player' }).click();

    // Wait for either admin prompt or edit modal dismissal
    const editAdminOrClosed = await Promise.race([
      adminHeading.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'admin').catch(() => null),
      editModal.waitFor({ state: 'hidden', timeout: 5000 }).then(() => 'closed').catch(() => null),
    ]);

    if (editAdminOrClosed === 'admin') {
      await page.getByPlaceholder('Enter admin password').fill('admin123');
      await page.getByRole('button', { name: 'Submit' }).click();
    }

    await expect(editModal).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: updatedPlayerName })).toBeVisible({ timeout: 10000 });

    // 4. Delete Player
    const updatedCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: updatedPlayerName });
    await updatedCard.getByLabel('Delete player').click();

    // Confirm deletion dialog
    const deleteModal = page.locator('.fixed.inset-0').filter({ hasText: 'Delete Player' });
    await expect(deleteModal).toBeVisible();
    await deleteModal.getByRole('button', { name: 'Delete', exact: true }).click();

    // Wait for either admin prompt or delete modal dismissal
    const deleteAdminOrClosed = await Promise.race([
      adminHeading.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'admin').catch(() => null),
      deleteModal.waitFor({ state: 'hidden', timeout: 5000 }).then(() => 'closed').catch(() => null),
    ]);

    if (deleteAdminOrClosed === 'admin') {
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
