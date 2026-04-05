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

    // 2. Select players for Team One (Alice, Bob)
    // In our seed, Alice and Bob should be available.
    // The PlayerGrid buttons have the player name.
    await page.getByRole('button', { name: 'Alice' }).click();
    await page.getByRole('button', { name: 'Bob' }).click();

    // 3. Select players for Team Two (Charlie, David)
    await page.getByRole('button', { name: 'Charlie' }).click();
    await page.getByRole('button', { name: 'David' }).click();

    // 4. Set scores (Team One wins 3-1)
    // We use the desktop score controls
    await page.getByLabel('Increase team one games won').click();
    await page.getByLabel('Increase team one games won').click();
    await page.getByLabel('Increase team one games won').click();

    await page.getByLabel('Increase team two games won').click();

    // 5. Submit the match
    await page.getByRole('button', { name: 'Record Game' }).click();

    // 6. Admin authentication modal should appear
    await expect(page.getByText('Admin Authentication Required')).toBeVisible();

    // 7. Enter password (admin123 from seed)
    await page.getByPlaceholder('Enter admin password').fill('admin123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 8. Success message should appear (in the Dashboard page handleRecordMatch)
    // We can check for the toast or just that the modal closed.
    await expect(page.getByText('Admin Authentication Required')).not.toBeVisible();
    await expect(page.getByText('Record Game')).not.toBeVisible();
  });

  test('should show error for invalid password', async ({ page }) => {
    await page.getByTitle('Actions').click();
    await page.getByRole('button', { name: 'Record Match' }).click();

    await page.getByRole('button', { name: 'Alice' }).click();
    await page.getByRole('button', { name: 'Charlie' }).click();

    await page.getByRole('button', { name: 'Record Game' }).click();

    await page.getByPlaceholder('Enter admin password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();
  });
});
