import { expect, type Page } from "@playwright/test";

export const DASHBOARD_PAGES = [
  { nav: "Overview", path: "/dashboard/overview", heading: /overview|dashboard/i },
  { nav: "Products", path: "/dashboard/products", heading: "Products" },
  { nav: "POS", path: "/dashboard/pos", heading: "Point of sale" },
  { nav: "Orders", path: "/dashboard/orders", heading: "Orders" },
  { nav: "Clients", path: "/dashboard/clients", heading: "Clients" },
  { nav: "Finances", path: "/dashboard/finances", heading: "Finances" },
  { nav: "Reports", path: "/dashboard/reports", heading: "Reports" },
] as const;

export function account(role: "ADMIN" | "STAFF" | "CUSTOMER") {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  if (!email || !password) throw new Error(`Set E2E_${role}_EMAIL and E2E_${role}_PASSWORD`);
  return { email, password };
}

export async function signIn(page: Page, role: "ADMIN" | "STAFF" | "CUSTOMER") {
  const { email, password } = account(role);
  await page.goto("/staff");
  await page.locator('input[autocomplete="username"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await page.waitForURL(/\/dashboard\//);
}

/** Collects console errors and failed API calls so a test can assert the page loaded cleanly. */
export function watchForProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
  page.on("requestfailed", (req) => problems.push(`failed: ${req.method()} ${req.url()} ${req.failure()?.errorText}`));
  page.on("response", (res) => {
    if (res.status() >= 400 && new URL(res.url()).pathname.startsWith("/api/")) {
      problems.push(`${res.status()}: ${res.request().method()} ${res.url()}`);
    }
  });
  return problems;
}

/** The input right after a form label (the dashboard forms render <label/><input/> pairs). */
export function field(page: Page, label: string, kind: "input" | "textarea" = "input") {
  return page.getByRole("dialog").locator(`label:text-is("${label}") + ${kind}`);
}

export function row(page: Page, text: string) {
  return page.getByRole("row").filter({ hasText: text });
}

export async function expectToast(page: Page, text: string) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}
