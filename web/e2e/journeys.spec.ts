import { expect, test } from "@playwright/test";
import { AI_ANSWER, FAITH_SERMON, mockBackend } from "./mocks";

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

test("home shows sermons, and playing one opens the player", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recent Sermons" })).toBeVisible();
  await expect(page.getByText("Healing Grace").filter({ visible: true }).first()).toBeVisible();

  // Phone shows the Quick Picks list ("Play <title>"), desktop shows cards ("Play")
  await page.getByRole("button", { name: /^Play( |$)/ }).first().click();

  await expect(page.getByRole("button", { name: "Close player" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Seek" })).toBeVisible();
});

test("search finds sermons by title and can be cleared", async ({ page }) => {
  await page.goto("/search");
  const searchBox = page.getByPlaceholder("Search sermons by title or topic...");

  await searchBox.fill("love");
  await expect(page.getByText("The Love Commandment 4").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Faith for Today").filter({ visible: true })).toHaveCount(0);
  await expect(page).toHaveURL(/(\?|&)q=love/);

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(searchBox).toHaveValue("");
  await expect(page).not.toHaveURL(/q=love/);
});

test("search URL can be opened directly with query and multiple preachers", async ({ page }) => {
  await page.goto("/search?q=Faith&preacher=Apostle%20Test%20Preacher");
  const searchBox = page.getByPlaceholder("Search sermons by title or topic...");
  await expect(searchBox).toHaveValue("Faith");
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
});

test("filtering by multiple preachers updates the URL and displays matching sermons", async ({ page }) => {
  await page.goto("/search");
  const preacherBtn = page.getByRole("button", { name: /^Preacher/ });
  await preacherBtn.click();

  // Select first preacher
  await page.getByRole("button", { name: "Apostle Test Preacher" }).click();
  await expect(page).toHaveURL(/preacher=Apostle\+Test\+Preacher/);

  // Select second preacher without closing dropdown
  await page.getByRole("button", { name: "Pastor Example" }).click();
  await expect(page).toHaveURL(/preacher=Apostle\+Test\+Preacher/);
  await expect(page).toHaveURL(/preacher=Pastor\+Example/);

  // Both preachers should have sermons visible
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("The Love Commandment 4").filter({ visible: true }).first()).toBeVisible();
});

test("series list opens a series with its sermons and count", async ({ page }) => {
  await page.goto("/series");

  await page.getByRole("link", { name: /Walking by Faith/ }).click();

  await expect(page).toHaveURL(/\/series\/s1$/);
  await expect(page.getByRole("heading", { name: "Walking by Faith" })).toBeVisible();
  await expect(page.getByText("1 sermon found").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
});

test("an old ?series= link moves to that series' own page", async ({ page }) => {
  await page.goto("/series?series=Walking%20by%20Faith");

  await expect(page).toHaveURL(/\/series\/s1$/);
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
});

test("sermon page shows details, and a favourite appears on the Favourites page", async ({ page }) => {
  await page.goto(`/sermons/${FAITH_SERMON.id}`);

  await expect(page.getByRole("heading", { level: 1, name: "Faith for Today" })).toBeVisible();
  await expect(page.getByText("A practical message on trusting God in everyday decisions.").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Hebrews 11:1").filter({ visible: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Save to Favourites" }).click();
  await expect(page.getByRole("button", { name: "Remove from Favourites" })).toBeVisible();

  await page.goto("/favourites");
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
});

test("asking the AI shows an answer and matching sermons", async ({ page }) => {
  await page.goto("/ai");

  await page.getByPlaceholder("e.g. sermons about faith in difficult times...").fill("how do I grow my faith?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText(AI_ANSWER).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();
});

test("the admin area sends logged-out visitors to the login page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("a failed data request shows an error with a working Try again button", async ({ page }) => {
  let failing = true;
  await page.route("**/api/sermons**", (route) =>
    failing ? route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"down"}' }) : route.fallback()
  );

  await page.goto("/");
  const alert = page.getByRole("alert").filter({ hasText: "couldn't load" });
  await expect(alert).toBeVisible({ timeout: 15_000 });

  failing = false;
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Healing Grace").filter({ visible: true }).first()).toBeVisible();
});

test("the player explains when audio cannot be loaded and offers Retry", async ({ page }) => {
  await page.goto(`/sermons/${FAITH_SERMON.id}`);

  await page.getByRole("button", { name: "Play Sermon" }).click();

  const alert = page.getByRole("alert").filter({ hasText: "Couldn't load this sermon" });
  await expect(alert).toBeVisible({ timeout: 15_000 });
  await expect(alert.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("transcripts explorer gates access with passcode, displays sermons and allows viewing transcripts", async ({ page }) => {
  await page.goto("/transcripts");

  // Step 1: Passcode Gate is shown
  await expect(page.getByRole("heading", { level: 1, name: "Transcripts Portal" })).toBeVisible({ timeout: 15_000 });
  const passcodeInput = page.getByPlaceholder("Enter passcode...");
  await expect(passcodeInput).toBeVisible();

  // Step 2: Enter authorized passcode and enter archive
  await passcodeInput.fill("clc-transcripts-access");
  await page.getByRole("button", { name: "Enter Transcripts Archive" }).click();

  // Step 3: Transcripts Explorer is rendered
  await expect(page.getByText("Transcripts Explorer").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder("Search sermon title...")).toBeVisible();

  // Step 4: Sermon list contains sermons from fixture
  await expect(page.getByText("Faith for Today").filter({ visible: true }).first()).toBeVisible();

  // Step 5: Active sermon transcript is displayed
  await expect(page.getByText("Walking by faith means trusting God").first()).toBeVisible();

  // Step 6: Copy button is present
  await expect(page.getByRole("button", { name: "Copy Transcript" })).toBeVisible();
});

