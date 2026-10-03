import { expect, test } from "@playwright/test";
import { DASHBOARD_PAGES, expectToast, field, row, signIn, watchForProblems } from "./helpers";

// Records are named per run so the suite can run repeatedly against the same database.
const RUN = Date.now().toString(36);
const SCREENSHOTS = process.env.E2E_SCREENSHOTS ?? "e2e/.results/screens";

// A real 1x1 PNG: the API stores uploads by their content, not their file name.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("signed in as admin", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept()); // the delete confirmations
    await signIn(page, "ADMIN");
    await expect(page).toHaveURL(/\/dashboard\/overview$/);
  });

  test("every dashboard link is in the nav and each page loads cleanly", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Dashboard" });
    for (const { nav: name } of DASHBOARD_PAGES) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }

    for (const { nav: name, path, heading } of DASHBOARD_PAGES) {
      const problems = watchForProblems(page);
      await nav.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${SCREENSHOTS}/${name.toLowerCase()}.png`, fullPage: true });
      expect(problems, `${path} had problems`).toEqual([]);
      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
      page.removeAllListeners("requestfailed");
      page.removeAllListeners("response");
    }
  });

  test("every dashboard route survives a deep link and a refresh", async ({ page }) => {
    for (const { path, heading } of DASHBOARD_PAGES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });

  test("products: create with an uploaded image, edit, delete", async ({ page }) => {
    const name = `E2E gloves ${RUN}`;
    await page.goto("/dashboard/products");

    await page.getByRole("button", { name: "New product" }).click();
    await field(page, "Name *").fill(name);
    await field(page, "Category").fill("PPE");
    await field(page, "Price (KSh)").fill("850");
    await field(page, "Stock").fill("40");
    await page.getByRole("dialog").locator('input[type="file"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expectToast(page, "Image uploaded.");
    await expect(page.getByRole("dialog").locator("img")).toBeVisible();
    await page.getByRole("button", { name: "Create" }).click();
    await expectToast(page, "Created");
    await expect(row(page, name)).toContainText("KSh 850");

    await row(page, name).getByRole("button").first().click();
    await field(page, "Price (KSh)").fill("900");
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Updated");
    await expect(row(page, name)).toContainText("KSh 900");

    await row(page, name).getByRole("button").last().click();
    await expectToast(page, "Deleted");
    await expect(row(page, name)).toHaveCount(0);
  });

  test("clients: create, edit, delete", async ({ page }) => {
    const name = `E2E Kisumu Dental ${RUN}`;
    await page.goto("/dashboard/clients");

    await page.getByRole("button", { name: "New client" }).click();
    await field(page, "Full name *").fill(name);
    await field(page, "Email").fill(`e2e-${RUN}@example.test`);
    await field(page, "Phone").fill("+254 712 345 678");
    await page.getByRole("button", { name: "Create" }).click();
    await expectToast(page, "Saved");
    await expect(row(page, name)).toContainText("+254 712 345 678");

    await row(page, name).getByRole("button").first().click();
    await field(page, "Address").fill("Oginga Odinga St, Kisumu");
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Saved");
    await expect(row(page, name)).toContainText("Kisumu");

    await row(page, name).getByRole("button").last().click();
    await expectToast(page, "Deleted");
    await expect(row(page, name)).toHaveCount(0);
  });

  test("orders: a POS sale appears in orders, its status can change, and stock goes down", async ({ page }) => {
    const product = `E2E masks ${RUN}`;
    const customer = `E2E walk-in ${RUN}`;
    await page.goto("/dashboard/products");
    await page.getByRole("button", { name: "New product" }).click();
    await field(page, "Name *").fill(product);
    await field(page, "Price (KSh)").fill("120");
    await field(page, "Stock").fill("10");
    await page.getByRole("button", { name: "Create" }).click();
    await expectToast(page, "Created");

    await page.goto("/dashboard/pos");
    await page.getByPlaceholder("Search name or category…").fill(product);
    await page.getByRole("button", { name: new RegExp(product) }).click();
    await page.getByRole("button", { name: new RegExp(product) }).click();
    await page.getByPlaceholder("Walk-in if empty").fill(customer);
    await page.getByRole("button", { name: "Complete sale" }).click();

    await page.goto("/dashboard/orders");
    await expect(row(page, customer)).toContainText("KSh 240");
    await row(page, customer).getByRole("combobox").click();
    await page.getByRole("option", { name: "delivered" }).click();
    await expectToast(page, "Status updated");
    await expect(row(page, customer).getByRole("combobox")).toContainText("delivered");

    await row(page, customer).getByRole("button").last().click();
    await expect(page.getByRole("dialog")).toContainText(`${product} × 2`);
    await page.keyboard.press("Escape");

    await page.goto("/dashboard/products");
    await expect(row(page, product)).toContainText("8");
  });

  test("expenses: add one and delete it, totals follow", async ({ page }) => {
    const description = `E2E delivery ${RUN}`;
    await page.goto("/dashboard/finances");

    await page.getByRole("button", { name: "Add expense" }).click();
    await field(page, "Category").fill("Transport");
    await field(page, "Description").fill(description);
    await field(page, "Amount (KSh)").fill("1250");
    await page.getByRole("dialog").getByRole("button", { name: "Add" }).click();
    await expectToast(page, "Expense added");
    await expect(row(page, description)).toContainText("KSh 1,250");

    await row(page, description).getByRole("button").click();
    await expect(row(page, description)).toHaveCount(0);
  });

  test("the overview and reports show figures from the API", async ({ page }) => {
    const overview = page.waitForResponse((r) => r.url().endsWith("/api/dashboard/overview"));
    await page.goto("/dashboard/overview");
    expect((await overview).status()).toBe(200);

    const reports = page.waitForResponse((r) => r.url().includes("/api/dashboard/reports"));
    await page.goto("/dashboard/reports");
    expect((await reports).status()).toBe(200);
  });
});

test("staff accounts see the same dashboard links as admins", async ({ page }) => {
  await signIn(page, "STAFF");
  const nav = page.getByRole("navigation", { name: "Dashboard" });
  for (const { nav: name } of DASHBOARD_PAGES) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
});

test("customer accounts are refused the dashboard", async ({ page }) => {
  await signIn(page, "CUSTOMER");
  await page.goto("/dashboard/products");
  await expect(page.getByText("Dashboard access")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Dashboard" })).toHaveCount(0);
});

test("signed-out visitors are sent to the sign-in page", async ({ page }) => {
  await page.goto("/dashboard/orders");
  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByText("Staff sign in")).toBeVisible();
});
