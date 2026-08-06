import { test, expect } from '@playwright/test';

test.describe('Shopping & Navigation Flows', () => {
  test('should display home page with header, product grid, and demo banner', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Amazon/i);

    // Check header logo
    const logo = page.locator('img[alt="Amazon"]').first();
    await expect(logo).toBeVisible();

    // Check demo mode banner presence
    const banner = page.locator('text=DEMO MODE');
    await expect(banner).toBeVisible();
  });

  test('should filter products when typing in the search bar', async ({ page }) => {
    await page.goto('/');

    // Type query in search bar
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('socks');

    // Click search button
    const searchButton = page.locator('button[aria-label="Search"]');
    await searchButton.click();

    // Verify filtered product visibility in page main container
    const mainContent = page.locator('main');
    await expect(mainContent).toContainText(/socks/i);
  });

  test('should update cart quantity badge when adding items to cart', async ({ page }) => {
    await page.goto('/');

    // Use JS dispatch to bypass react-window pointer-event interception on virtualized rows
    await page.waitForSelector('button:has-text("Add to Cart")', { state: 'visible' });
    await page.evaluate(() => {
      const btn = document.querySelector('button') as HTMLElement;
      const addToCart = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add to Cart'
      ) as HTMLElement | undefined;
      addToCart?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      void btn;
    });

    // Wait for cart aria-label to reflect updated count
    const cartLink = page.locator('a[aria-label^="Cart,"]');
    await expect(cartLink).toHaveAttribute('aria-label', /Cart, [1-9]/);
  });
});
