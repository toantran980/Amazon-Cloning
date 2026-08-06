import { test, expect } from '@playwright/test';

test.describe('Auth & Checkout Flows', () => {
  test('should navigate to login page and display login form', async ({ page }) => {
    await page.goto('/');

    const signInLink = page.locator('text=Hello, sign in');
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should allow adding items to cart as guest and navigating to checkout', async ({ page }) => {
    await page.goto('/');

    // Use JS dispatch to bypass react-window pointer-event interception on virtualized rows
    await page.waitForSelector('button:has-text("Add to Cart")', { state: 'visible' });
    await page.evaluate(() => {
      const addToCart = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add to Cart'
      ) as HTMLElement | undefined;
      addToCart?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    // Wait for cart count to update then navigate
    const cartLink = page.locator('a[aria-label^="Cart,"]');
    await expect(cartLink).toHaveAttribute('aria-label', /Cart, [1-9]/);
    await cartLink.click();

    // Verify checkout page URL & layout
    await expect(page).toHaveURL(/\/checkout/);

    // Verify Order Summary card
    const orderSummary = page.locator('text=Order Summary');
    await expect(orderSummary).toBeVisible();
  });
});
