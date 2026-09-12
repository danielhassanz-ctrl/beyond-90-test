import { webkit, devices } from "@playwright/test";

const baseURL = (process.env.BEYOND90_URL || "http://127.0.0.1:4173/beyond-90-test/").replace(/\/?$/, "/");
const browser = await webkit.launch();
const context = await browser.newContext({ ...devices["iPhone 14"] });

await context.addInitScript(() => {
  window.__b90ShareCalls = [];
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
  await page.waitForURL(/\/onboarding$/, { timeout: 10_000 });
  await page.getByPlaceholder("Álvaro Nieto").fill("Share QA");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Pro\b/i }).click();
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await page.waitForURL(/\/historia$/, { timeout: 10_000 });

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await page.waitForURL(/\/cantera$/, { timeout: 10_000 });

  const clubs = page.locator("ul > li > button");
  if ((await clubs.count()) !== 4) throw new Error("expected four academy offers before share QA");
  await clubs.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await page.waitForURL(/\/historia$/, { timeout: 10_000 });

  await page.goto(new URL("legado", baseURL).toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("button", { name: "Compartir mi carrera" }).waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("button", { name: "Compartir mi carrera" }).click();
  await page.getByText("Compartido.", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });

  const calls = await page.evaluate(() => window.__b90ShareCalls || []);
  if (calls.length !== 2) throw new Error(`expected file-share attempt plus text fallback, got ${calls.length}`);
  if (!calls[0]?.hasFiles) throw new Error("first share attempt did not include generated PNG");
  if (calls[1]?.hasFiles) throw new Error("text fallback unexpectedly included files");
  if (!/BEYOND 90/i.test(calls[1]?.text || "")) throw new Error("text fallback did not include Beyond 90 share copy");
  if (calls[1]?.title !== "BEYOND 90") throw new Error(`unexpected share title: ${calls[1]?.title || "<empty>"}`);
  if (errors.length) throw new Error(errors.join(" | "));

  console.log("SHARE_FALLBACK_WEBKIT_OK fileAttempt=1 textFallback=1 status=shared");
} finally {
  await browser.close();
}
