const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();

test.use({ ...devices["iPhone 13"] });

test("iPhone WebKit shares a pre-rendered career card in the original tap task", async ({ page }) => {
  await page.addInitScript(() => {
    window.__b90ShareProbe = { calls: 0, sameTask: false, hasImage: false, hasText: false };
    let shareTapTask = false;

    document.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target.closest("button") : null;
        if (!target || !/Compartir (mi )?carrera/i.test(target.textContent || "")) return;
        shareTapTask = true;
        // Transient user activation survives microtasks and is consumed at the
        // browser task boundary. Reset on the next task, not in a microtask.
        setTimeout(() => {
          shareTapTask = false;
        }, 0);
      },
      true,
    );

    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data) => Array.isArray(data?.files) && data.files.length === 1,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.__b90ShareProbe = {
          calls: window.__b90ShareProbe.calls + 1,
          sameTask: shareTapTask,
          hasImage: Array.isArray(data?.files) && data.files.some((file) => file?.type === "image/png"),
          hasText: typeof data?.text === "string" && data.text.includes("BEYOND 90"),
        };
      },
    });
  });

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Share");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Leal/ }).click();
  await page.getByRole("button", { name: "Empezar tu historia" }).click();

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await expect(page).toHaveURL(/\/cantera\/?$/);
  const clubs = page.locator("ul > li > button");
  await expect(clubs).toHaveCount(4);
  await clubs.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);

  await page.goto(routeUrl("legado"));
  const shareButton = page.getByRole("button", { name: "Compartir mi carrera" });
  await expect(shareButton).toBeEnabled({ timeout: 10_000 });
  await shareButton.click();
  await expect(page.getByText("Compartido.")).toBeVisible();

  const probe = await page.evaluate(() => window.__b90ShareProbe);
  expect(probe.calls).toBe(1);
  expect(probe.sameTask).toBe(true);
  expect(probe.hasImage).toBe(true);
  expect(probe.hasText).toBe(true);
});
