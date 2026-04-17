import { test, expect } from '@playwright/test';

test.describe('Match Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    // We assume the DB is seeded with Alice, Bob, Charlie, David
    await page.goto('/', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should record a match with admin authentication', async ({ page }) => {
    // 1. Open the FAB and select Record Match
    await page.getByTitle('Actions').click();
    await page.getByRole('menuitem', { name: 'Record Match' }).click();

    // 2. Wait for the Record Game modal to appear and players to load
    const modal = page.locator('.fixed.inset-0').locator('.bg-white');
    await expect(modal.getByRole('heading', { name: 'Record Game' })).toBeVisible();

    // Locate team sections by their heading text
    const teamOneSection = modal.locator('div.space-y-3').filter({ hasText: 'Team One' });
    const teamTwoSection = modal.locator('div.space-y-3').filter({ hasText: 'Team Two' });

    // Wait for player buttons to render
    await expect(teamOneSection.getByRole('button', { name: 'Alice' })).toBeVisible({ timeout: 10000 });

    // 3. Select players for Team One (Alice, Bob)
    await teamOneSection.getByRole('button', { name: 'Alice' }).click();
    await teamOneSection.getByRole('button', { name: 'Bob' }).click();

    // 4. Select players for Team Two (Charlie, David)
    await teamTwoSection.getByRole('button', { name: 'Charlie' }).click();
    await teamTwoSection.getByRole('button', { name: 'David' }).click();

    // 5. Set scores (Team One wins 3-1)
    //    The modal has mobile (md:hidden) and desktop (hidden md:grid) score controls
    //    with identical aria-labels. Use .filter({ visible: true }) to target only
    //    the controls visible at the current viewport (Desktop Chrome = 1280x720).
    const teamOneIncrease = modal.getByLabel('Increase team one games won').filter({ visible: true });
    const teamTwoIncrease = modal.getByLabel('Increase team two games won').filter({ visible: true });

    await teamOneIncrease.click();
    await teamOneIncrease.click();
    await teamOneIncrease.click();

    await teamTwoIncrease.click();

    // 6. Submit the match
    await modal.getByRole('button', { name: 'Record Game' }).click();

    // 7. Admin authentication modal should appear (use heading to avoid strict mode)
    const authHeading = page.getByRole('heading', { name: 'Admin Authentication Required' });
    await expect(authHeading).toBeVisible();

    // 8. Enter password (admin123 from seed)
    await page.getByPlaceholder('Enter admin password').fill('admin123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 9. Success: auth modal should close
    await expect(authHeading).not.toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid password', async ({ page }) => {
    // 1. Open the FAB and select Record Match
    await page.getByTitle('Actions').click();
    await page.getByRole('menuitem', { name: 'Record Match' }).click();

    // 2. Wait for modal
    const modal = page.locator('.fixed.inset-0').locator('.bg-white');
    await expect(modal.getByRole('heading', { name: 'Record Game' })).toBeVisible();

    const teamOneSection = modal.locator('div.space-y-3').filter({ hasText: 'Team One' });
    const teamTwoSection = modal.locator('div.space-y-3').filter({ hasText: 'Team Two' });

    await expect(teamOneSection.getByRole('button', { name: 'Alice' })).toBeVisible({ timeout: 10000 });

    // 3. Select one player per team (minimum required)
    await teamOneSection.getByRole('button', { name: 'Alice' }).click();
    await teamTwoSection.getByRole('button', { name: 'Charlie' }).click();

    // 4. Submit
    await modal.getByRole('button', { name: 'Record Game' }).click();

    // 5. Enter an invalid password
    await page.getByPlaceholder('Enter admin password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 6. Error message should be visible
    await expect(page.getByText('Invalid password')).toBeVisible({ timeout: 10000 });
  });
});
