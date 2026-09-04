const { test, expect, devices } = require("@playwright/test");

test.use({
  ...devices["iPhone 13"],
});

test("iPhone WebKit recovers a deep link without a save", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("http://127.0.0.1:4173/historia");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByText(/Volviendo a portada|Cargando carrera|Simulador narrativo de carrera/)).toBeVisible();
  await page.waitForURL("http://127.0.0.1:4173/", { timeout: 5000 }).catch(() => {});

  if (page.url().endsWith("/historia")) {
    await page.getByRole("button", { name: "Continuar" }).click();
  }

  await expect(page.getByRole("button", { name: "Nueva carrera" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit completes onboarding, shows four academies and keeps the save", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("http://127.0.0.1:4173/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByRole("button", { name: "Nueva carrera" })).toBeEnabled();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Mobile");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();

  await expect(page).toHaveURL(/\/cantera$/);
  await expect(page.getByRole("heading", { name: "Cuatro canteras te quieren" })).toBeVisible();

  const academyButtons = page.locator("ul > li > button");
  await expect(academyButtons).toHaveCount(4);
  await expect(page.getByRole("button", { name: /Real Betis/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Villarreal/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sevilla FC/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Málaga CF/ })).toBeVisible();

  await page.getByRole("button", { name: /Real Betis/ }).click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(viewportFits).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  await page.goto("http://127.0.0.1:4173/");
  await expect(page.getByText("Partida guardada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/historia$/);

  expect(pageErrors).toEqual([]);
});
