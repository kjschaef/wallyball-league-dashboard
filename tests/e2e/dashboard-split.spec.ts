import { test, expect } from '@playwright/test';

test.describe('Dashboard Two-Column Split & Power Rankings', () => {
  test('renders Season Standings and League Power Rankings side-by-side on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Verify main header
    await expect(page.getByRole('heading', { name: /League Dashboard/i })).toBeVisible({ timeout: 30000 });

    // Verify Left Column: Season Standings table
    await expect(page.getByText(/Season Standings/i)).toBeVisible();

    // Verify Right Column: League Power Rankings panel
    await expect(page.getByText(/League Power Rankings/i)).toBeVisible();
    await expect(page.getByText(/All-Time Career Elo/i)).toBeVisible();

    // Verify Podium Medals exist
    await expect(page.getByText('#1')).toBeVisible();

    // Verify Chart metric toggle to Career Elo
    const eloBtn = page.getByRole('button', { name: 'Career Elo' });
    await expect(eloBtn).toBeVisible();
    await eloBtn.click();
    await expect(eloBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('supports 1-tap switching between Season Race and Power Rankings on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /League Dashboard/i })).toBeVisible({ timeout: 30000 });

    // Verify mobile segmented tab switcher
    const seasonTab = page.getByRole('button', { name: /Season Race/i });
    const eloTab = page.getByRole('button', { name: /Power Rankings \(Elo\)/i });

    await expect(seasonTab).toBeVisible();
    await expect(eloTab).toBeVisible();

    // Switch to Power Rankings tab
    await eloTab.click();
    await expect(page.getByText(/All-Time Career Elo/i)).toBeVisible();

    // Switch back to Season Race tab
    await seasonTab.click();
    await expect(page.getByText(/Season Standings/i)).toBeVisible();
  });
});
