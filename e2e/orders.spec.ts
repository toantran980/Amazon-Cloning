import { test, expect } from '@playwright/test';

test.describe('Order History & Package Tracking Flows', () => {
  test('should display orders page when navigating to /orders', async ({ page }) => {
    await page.goto('/orders');

    // Verify Orders page heading
    const heading = page.locator('h1');
    await expect(heading).toContainText(/your orders/i);
  });

  test('should navigate from header Returns & Orders link', async ({ page }) => {
    await page.goto('/');

    const returnsOrdersLink = page.locator('text=Returns');
    await expect(returnsOrdersLink).toBeVisible();
    await returnsOrdersLink.click();

    await expect(page).toHaveURL(/\/orders/);
  });
});
