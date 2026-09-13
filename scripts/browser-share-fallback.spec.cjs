const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.use({ ...devices["iPhone 13"] });

async function reachLegacy(page) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Fallback");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
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
}

test("iPhone WebKit falls back to a usable preview after native file share fails", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.__b90FallbackProbe = { shareCalls: 0, clipboard: "" };
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data) => Array.isArray(data?.files) && data.files.length === 1,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        window.__b90FallbackProbe.shareCalls += 1;
        throw new DOMException("Native sheet unavailable", "NotAllowedError");
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__b90FallbackProbe.clipboard = text;
        },
      },
    });
  });

  await reachLegacy(page);

  const shareButton = page.getByRole("button", { name: "Compartir mi carrera" });
  await expect(shareButton).toBeEnabled({ timeout: 10_000 });
  await shareButton.click();

  const preview = page.getByRole("dialog", { name: "Vista previa de la career card" });
  await expect(preview).toBeVisible();
  await expect(preview.getByAltText("Career card de Beyond 90")).toBeVisible();
  await expect(preview.getByText("Mantén pulsada la imagen para guardarla en tu galería.")).toBeVisible();
  await expect(preview.getByRole("button", { name: "Descargar PNG" })).toHaveCount(0);

  let probe = await page.evaluate(() => window.__b90FallbackProbe);
  expect(probe.shareCalls).toBe(1);

  await preview.getByRole("button", { name: "Copiar texto" }).click();
  await expect(preview.getByRole("status")).toHaveText("Texto copiado al portapapeles.");
  probe = await page.evaluate(() => window.__b90FallbackProbe);
  expect(probe.clipboard).toContain("BEYOND 90");

  await preview.getByRole("button", { name: "Cerrar" }).click();
  await expect(preview).toHaveCount(0);
  await expect(shareButton).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
