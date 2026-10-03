import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { FAITH_SERMON, mockBackend } from "./mocks";

// Automated WCAG 2.2 A/AA checks (axe-core) on every public page, at desktop and phone width.
// Automated checks catch roughly a third of accessibility problems; they complement, not replace,
// manual keyboard and screen-reader testing.
const PAGES = [
  { name: "home", path: "/", ready: "Recent Sermons" },
  { name: "search", path: "/search?q=faith", ready: "Showing" },
  { name: "series", path: "/series", ready: "All Series" },
  { name: "sermon", path: `/sermons/${FAITH_SERMON.id}`, ready: "About this Sermon" },
  { name: "ask AI", path: "/ai", ready: "What are you looking for?" },
  { name: "favourites", path: "/favourites", ready: "No Favourites Yet" },
  { name: "login", path: "/login", ready: "Admin Portal" },
];

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

for (const { name, path, ready } of PAGES) {
  test(`${name} page has no automatically detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(ready).filter({ visible: true }).first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    // Readable failure output: rule, impact, and the first few offending elements
    const summary = results.violations.map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    }));
    expect(summary).toEqual([]);
  });
}
