import { expect, test, type Page } from "@playwright/test";
import { expectToast, field, row, signIn } from "./helpers";

// The website shows exactly what the POS has: new products, prices, photos, stock and publishing.

const RUN = Date.now().toString(36);
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function editProduct(page: Page, name: string, change: () => Promise<void>) {
  await page.goto("/dashboard/products");
  await row(page, name).getByRole("button").first().click();
  await change();
  await page.getByRole("button", { name: "Save" }).click();
  await expectToast(page, "Updated");
}

test("a product made in the POS appears on the storefront and follows every change", async ({ page, context }) => {
  const name = `E2E storefront gloves ${RUN}`;
  page.on("dialog", (d) => d.accept());
  await signIn(page, "ADMIN");

  // 1. Create it in the POS with a photo.
  await page.goto("/dashboard/products");
  await page.getByRole("button", { name: "New product" }).click();
  await field(page, "Name *").fill(name);
  await field(page, "Category").fill(`E2E PPE ${RUN}`);
  await field(page, "Unit").fill("box");
  await field(page, "Price (KSh)").fill("850");
  await field(page, "Stock").fill("40");
  await page.getByRole("dialog").locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Create" }).click();
  await expectToast(page, "Created");

  // 2. A visitor (no session) finds it on the storefront, photo and all.
  const visitor = await context.browser()!.newPage();
  await visitor.goto(`/products?q=${encodeURIComponent(name)}`);
  const card = visitor.getByRole("link", { name: new RegExp(name) });
  await expect(card).toContainText("KSh 850 / box");
  const img = card.locator("img");
  await expect(img).toHaveAttribute("src", /X-Amz-Signature=/);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

  await card.click();
  await expect(visitor.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(visitor.getByText("In stock", { exact: true })).toBeVisible();

  // 3. Price and stock changes show up on reload, without a redeploy.
  await editProduct(page, name, async () => {
    await field(page, "Price (KSh)").fill("900");
    await field(page, "Stock").fill("0");
  });
  await visitor.reload();
  await expect(visitor.getByText("KSh 900 / box")).toBeVisible();
  await expect(visitor.getByText("Out of stock", { exact: true })).toBeVisible();

  // 4. Unpublished in the POS: gone from the list and the product page.
  await editProduct(page, name, async () => {
    await page.getByRole("dialog").getByRole("switch").nth(1).click(); // Show on website
  });
  await visitor.reload();
  await expect(visitor.getByRole("heading", { name: "This product isn't available" })).toBeVisible();
  await visitor.goto(`/products?q=${encodeURIComponent(name)}`);
  await expect(visitor.getByRole("heading", { name: "No products match your search" })).toBeVisible();

  // Clean up.
  await page.goto("/dashboard/products");
  await row(page, name).getByRole("button").last().click();
  await expectToast(page, "Deleted");
});

test("products without a photo get a neutral placeholder", async ({ page, context }) => {
  const name = `E2E no photo ${RUN}`;
  page.on("dialog", (d) => d.accept());
  await signIn(page, "ADMIN");
  await page.goto("/dashboard/products");
  await page.getByRole("button", { name: "New product" }).click();
  await field(page, "Name *").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expectToast(page, "Created");

  const visitor = await context.browser()!.newPage();
  await visitor.goto(`/products?q=${encodeURIComponent(name)}`);
  const card = visitor.getByRole("link", { name: new RegExp(name) });
  await expect(card.getByRole("img", { name: "No photo yet" })).toBeVisible();
  await expect(card).toContainText("Price on request");

  await page.goto("/dashboard/products");
  await row(page, name).getByRole("button").last().click();
  await expectToast(page, "Deleted");
});

test("the storefront shows an error with a retry when the API is unreachable", async ({ page }) => {
  await page.route("**/api/public/**", (route) => route.abort());
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "We couldn't load the catalog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
