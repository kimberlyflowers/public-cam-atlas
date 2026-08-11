import { expect, test } from "@playwright/test";

const site = process.env.PLAYWRIGHT_BASE_URL || "https://public-cam-atlas.vercel.app";

test("every listed live dashcam advances actual video", async ({ page }) => {
  await page.goto(site);
  await page.getByLabel("Type").selectOption("dashcam");
  const cards = page.locator(".camera-card");
  await expect(cards).toHaveCount(4);
  for (let index = 0; index < await cards.count(); index += 1) {
    await cards.nth(index).click();
    const player = page.locator('iframe[title^="Live view from"]');
    await expect(player).toBeVisible();
    await expect.poll(() => page.frames().map((item) => item.url()), { timeout: 15_000 }).toEqual(expect.arrayContaining([expect.stringContaining("youtube-nocookie.com/embed")]));
    const frame = page.frames().find((item) => item.url().includes("youtube-nocookie.com/embed"));
    expect(frame, "YouTube player frame should load").toBeTruthy();
    const video = frame!.locator("video");
    await expect(video).toBeVisible({ timeout: 15_000 });
    const before = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
    await page.waitForTimeout(2500);
    const after = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
    expect(after).toBeGreaterThan(before + 1);
    await page.getByRole("button", { name: "Close" }).click();
  }
});

test("Bexar HLS camera loads and advances video", async ({ page }) => {
  await page.goto(site);
  await page.getByLabel("Area").selectOption("Bexar County");
  await page.getByPlaceholder("Search a road, city, or county").fill("Ackerman");
  await page.getByRole("button", { name: /IH10 @ Ackerman Rd/i }).click();
  const video = page.locator("video.player");
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => ({ time: node.currentTime, ready: node.readyState, error: node.error?.message || null })), { timeout: 20_000 }).toMatchObject({ ready: 4, error: null });
  const before = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
  await page.waitForTimeout(2500);
  const after = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
  expect(after).toBeGreaterThan(before + 1);
});
