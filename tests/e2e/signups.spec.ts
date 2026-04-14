import { test, expect } from '@playwright/test';

test.describe('Signups Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signups
    await page.goto('/signups', { waitUntil: 'networkidle', timeout: 90000 });
  });

  test('should render the Signups page and primary interactive elements', async ({ page }) => {
    // Expect header
    await expect(page.getByRole('heading', { name: 'Weekly Signups' })).toBeVisible();

    // The Export button should be visible
    // The Export button should be visible
    await expect(page.getByRole('button', { name: 'Export' }).first()).toBeVisible();

    // As testing exact logic of signups requires mocking dates and the server state,
    // we'll check if either the closed state or the open state renders appropriately.
    // If it's closed, there's a text "Signups are currently closed."
    // If it's open, there's a select element with "-- Who are you? --"

    const isClosedTextVisible = await page.getByText('Signups are currently closed.').isVisible();

    if (isClosedTextVisible) {
      // Expect closed state countdown or closed message
      await expect(page.getByText('Signups are currently closed.')).toBeVisible();
    } else {
      // Expect open state tools
      const playerSelect = page.getByRole('combobox');
      await expect(playerSelect).toBeVisible();
      
      const outButton = page.getByRole('button', { name: 'Out This Week' });
      await expect(outButton).toBeVisible();
      
      // If there are upcoming dates available, verify 'Sign Up' or 'Join Waitlist' button exists
      // as there may be multiple cards we use .first()
      const signUpButton = page.getByRole('button', { name: 'Sign Up' }).first();
      const waitlistButton = page.getByRole('button', { name: 'Join Waitlist' }).first();
      // Only require them if the dates list isn't empty, so resolving the promise loosely
      const hasCards = await page.locator('.bg-white.rounded-lg.border.border-gray-200').count() > 0;
      if (hasCards) {
        const isSignUpVisible = await signUpButton.isVisible();
        const isWaitlistVisible = await waitlistButton.isVisible();
        expect(isSignUpVisible || isWaitlistVisible).toBe(true);
      }
    }
  });

  test('Export button should update to Copied state temporarily', async ({ page, context }) => {
    // Grant clipboard permissions to avoid failures in some browsers
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    
    const exportButton = page.getByRole('button', { name: 'Export' }).first();
    await expect(exportButton).toBeVisible();

    await exportButton.click();
    await expect(page.getByText('Copied!')).toBeVisible();
  });
});
