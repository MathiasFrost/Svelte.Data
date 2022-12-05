import { expect, test } from "@playwright/test";

test("Root page has expected h1", async ({ page }) => {
	await page.goto("/");
	expect(await page.textContent("h1")).toBe("Svelte.StoresPlus");
});
