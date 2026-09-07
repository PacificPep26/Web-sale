import { test, expect } from "@playwright/test";

test("home renders the niche brand + hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", /cases|eyewear|toys/);
  await expect(page.getByRole("link", { name: /shop/i }).first()).toBeVisible();
});

test("PLP lists products and links to a PDP", async ({ page }) => {
  await page.goto("/collections/cases");
  const firstCard = page.locator('a[href^="/products/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/products\//);
  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
});

test("add to cart → cart shows the line item", async ({ page }) => {
  await page.goto("/products/slim-shockproof-phone-case");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByRole("button", { name: /added/i })).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText(/Slim Shockproof Phone Case/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /checkout/i })).toBeVisible();
});

test("visual: home snapshot", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("home.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
});
