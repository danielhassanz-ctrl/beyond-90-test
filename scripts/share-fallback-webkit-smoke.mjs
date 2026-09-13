import { webkit, devices } from "@playwright/test";

const baseURL = (process.env.BEYOND90_URL || "http://127.0.0.1:4173/beyond-90-test/").replace(/\/?$/, "/");
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const browser = await webkit.launch();
const context = await browser.newContext({ ...devices["iPhone 13"] });

await context.addInitScript(() => {
  window.__b90ShareCalls = [];
  window.__b90ClipboardWrites = [];
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: (data) => Boolean(data && Array.isArray(data.files) && data.files.length),
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (data) => {
      const snapshot = {
        hasFiles: Boolean(data && Array.isArray(data.files) && data.files.length),
        text: data?.text || "",
        title: data?.title || "",
      };
      window.__b90ShareCalls.push(snapshot);
      if (snapshot.hasFiles) throw new Error("QA forced file-share failure");
    },
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text) => {
        window.__b90ClipboardWrites.push(text);
      },
    },
  });
});

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

try {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.waitForURL(/\/onboarding\/?$/, { timeout: 10_000 });
  await page.getByPlaceholder("Álvaro Nieto").fill("Share QA");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await page.waitForURL(/\/historia\/?$/, { timeout: 10_000 });

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await page.waitForURL(/\/cantera\/?$/, { timeout: 10_000 });
  await page.getByRole("heading", { name: "Ahora sí: cuatro caminos" }).waitFor({ state: "visible", timeout: 10_000 });

  const clubs = page.locator("ul > li > button");
  await page.waitForFunction(
    () => document.querySelectorAll("ul > li > button").length === 4,
    null,
    { timeout: 10_000 },
  );
  if ((await clubs.count()) !== 4) throw new Error("expected four academy offers before share QA");
  await clubs.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await page.waitForURL(/\/historia\/?$/, { timeout: 10_000 });

  await page.goto(new URL("legado", baseURL).toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
  const shareButton = page.getByRole("button", { name: "Compartir mi carrera" });
  await shareButton.waitFor({ state: "visible", timeout: 10_000 });
  await shareButton.click();

  const preview = page.getByRole("dialog", { name: "Vista previa de la career card" });
  await preview.waitFor({ state: "visible", timeout: 10_000 });
  await preview.getByAltText("Career card de Beyond 90").waitFor({ state: "visible", timeout: 10_000 });
  if ((await preview.getByRole("button", { name: "Descargar PNG" }).count()) !== 0) {
    throw new Error("iPhone preview unexpectedly offered direct PNG download");
  }

  const calls = await page.evaluate(() => window.__b90ShareCalls || []);
  if (calls.length !== 1) throw new Error(`expected exactly one native share attempt, got ${calls.length}`);
  if (!calls[0]?.hasFiles) throw new Error("native share attempt did not include generated PNG");
  if (!/BEYOND 90/i.test(calls[0]?.text || "")) throw new Error("native share attempt did not include Beyond 90 copy");
  if (calls[0]?.title !== "BEYOND 90") throw new Error(`unexpected share title: ${calls[0]?.title || "<empty>"}`);

  await preview.getByRole("button", { name: "Copiar texto" }).click();
  await preview.getByText("Texto copiado al portapapeles.", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  const clipboardWrites = await page.evaluate(() => window.__b90ClipboardWrites || []);
  if (clipboardWrites.length !== 1 || !/BEYOND 90/i.test(clipboardWrites[0] || "")) {
    throw new Error("preview copy fallback did not preserve Beyond 90 share copy");
  }

  await preview.getByRole("button", { name: "Cerrar" }).click();
  await preview.waitFor({ state: "hidden", timeout: 10_000 });
  if (errors.length) throw new Error(errors.join(" | "));

  console.log("SHARE_FALLBACK_WEBKIT_OK fileAttempt=1 preview=1 copyFallback=1 avatar=required");
} finally {
  await browser.close();
}