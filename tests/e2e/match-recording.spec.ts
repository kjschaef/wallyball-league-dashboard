import { test, expect } from '@playwright/test';

test.describe('Match Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    // We assume the DB is seeded with Alice, Bob, Charlie, David
    await page.goto('/', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should record a match with admin authentication', async ({ page }) => {
    // 1. Open the FAB and select Record Match
    await page.getByTitle('Actions').click();
    await page.getByRole('button', { name: 'Record Match' }).click();

    // 2. Wait for the Record Game modal to appear and players to load
    const modal = page.locator('.fixed.inset-0').locator('.bg-white');
    await expect(modal.getByRole('heading', { name: 'Record Game' })).toBeVisible();
    // Wait for player buttons to render inside the modal
    await expect(modal.getByRole('button', { name: 'Alice' })).toBeVisible({ timeout: 10000 });

    // 3. Select players for Team One (Alice, Bob) — within the modal
    await modal.getByRole('button', { name: 'Alice' }).click();
    await modal.getByRole('button', { name: 'Bob' }).click();

    // 4. Select players for Team Two (Charlie, David) — within the modal
    await modal.getByRole('button', { name: 'Charlie' }).click();
    await modal.getByRole('button', { name: 'David' }).click();

    // 5. Set scores (Team One wins 3-1)
    //    Use .first() to select from mobile/desktop duplicate aria-labels
    await modal.getByLabel('Increase team one games won').first().click();
    await modal.getByLabel('Increase team one games won').first().click();
    await modal.getByLabel('Increase team one games won').first().click();

    await modal.getByLabel('Increase team two games won').first().click();

    // 6. Submit the match
    await modal.getByRole('button', { name: 'Record Game' }).click();

    // 7. Admin authentication modal should appear
    await expect(page.getByText('Admin Authentication Required')).toBeVisible();

    // 8. Enter password (admin123 from seed)
    await page.getByPlaceholder('Enter admin password').fill('admin123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 9. Success: auth modal and record modal should both close
    await expect(page.getByText('Admin Authentication Required')).not.toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid password', async ({ page }) => {
    // 1. Open the FAB and select Record Match
    await page.getByTitle('Actions').click();
    await page.getByRole('button', { name: 'Record Match' }).click();

    // 2. Wait for modal
    const modal = page.locator('.fixed.inset-0').locator('.bg-white');
    await expect(modal.getByRole('heading', { name: 'Record Game' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Alice' })).toBeVisible({ timeout: 10000 });

    // 3. Select one player per team (minimum required)
    await modal.getByRole('button', { name: 'Alice' }).click();
    await modal.getByRole('button', { name: 'Charlie' }).click();

    // 4. Submit
    await modal.getByRole('button', { name: 'Record Game' }).click();

    // 5. Enter an invalid password
    await page.getByPlaceholder('Enter admin password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 6. Error message should be visible
    await expect(page.getByText('Invalid password')).toBeVisible({ timeout: 10000 });
  });
});
