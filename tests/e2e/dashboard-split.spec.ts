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
    const powerRankingsPanel = page.getByText(/League Power Rankings/i);
    await expect(powerRankingsPanel).toBeVisible();
    await expect(page.getByText(/All-Time Power Rankings/i)).toBeVisible();

    // Verify Podium Medals exist
    await expect(page.getByText('#1', { exact: true })).toBeVisible();

    // Verify right column matches left column height on desktop
    const leftCol = page.locator('.lg\\:col-span-8');
    const rightCol = page.locator('.lg\\:col-span-4');
    const leftBox = await leftCol.boundingBox();
    const rightBox = await rightCol.boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    if (leftBox && rightBox) {
      expect(Math.abs(leftBox.height - rightBox.height)).toBeLessThanOrEqual(5);
    }

    // Verify Chart metric toggle to Power Ranking
    const eloBtn = page.getByRole('button', { name: 'Power Ranking', exact: true });
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
    const eloTab = page.getByRole('button', { name: /Power Rankings/i });

    await expect(seasonTab).toBeVisible();
    await expect(eloTab).toBeVisible();

    // Switch to Power Rankings tab
    await eloTab.click();
    await expect(page.getByText(/All-Time Power Rankings/i)).toBeVisible();

    // Switch back to Season Race tab
    await seasonTab.click();
    await expect(page.getByText(/Season Standings/i)).toBeVisible();
  });

  test('opens the "How it works" Power Rankings explainer modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const howItWorksBtn = page.getByRole('button', { name: /how it works/i });
    await expect(howItWorksBtn).toBeVisible({ timeout: 30000 });
    await howItWorksBtn.click();

    await expect(page.getByRole('heading', { name: /How League Power Rankings Work/i })).toBeVisible();
    await expect(page.getByText(/Scored Games vs\. Unscored Games/i)).toBeVisible();
    await expect(page.getByText(/Up to 2\.0x Multiplier/i)).toBeVisible();

    const closeBtn = page.getByRole('button', { name: /got it, close/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(page.getByRole('heading', { name: /How League Power Rankings Work/i })).not.toBeVisible();
  });
});
