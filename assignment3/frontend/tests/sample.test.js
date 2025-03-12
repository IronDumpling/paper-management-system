const puppeteer = require("puppeteer");

// Increase timeout for slower systems
jest.setTimeout(30000);

// Helper to wait for and verify success messages
async function waitForSuccessMessage(page, message, timeout = 5000) {
  await page.waitForFunction(
    (msg) => {
      const divs = Array.from(document.querySelectorAll("div"));
      return divs.some((div) => div.textContent.trim() === msg);
    },
    { timeout },
    message
  );
  const success = await page.evaluate((msg) => {
    const divs = Array.from(document.querySelectorAll("div"));
    const successDiv = divs.find((div) => div.textContent.trim() === msg);
    return successDiv ? successDiv.textContent.trim() : null;
  }, message);
  return success;
}

describe("Assignment 3: React Frontend", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:5173");
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Home page displays correct layout", async () => {
    // Verify main heading and section titles
    const title = await page.$eval("h1", (el) => el.textContent);
    const createHeading = await page.$eval(
      "h2:first-of-type",
      (el) => el.textContent
    );
    const papersHeading = await page.$eval(
      "h2:nth-of-type(2)",
      (el) => el.textContent
    );

    expect(title).toBe("Paper Management System");
    expect(createHeading).toBe("Create New Paper");
    expect(papersHeading).toBe("Papers");
    expect(await page.$("form")).not.toBeNull(); // Form exists
    expect(await page.$("div")).not.toBeNull(); // Paper list container exists
  });

  test('Paper list shows "No papers found" when empty', async () => {
    await page.waitForFunction(
      () =>
        !document.querySelector("div").textContent.includes("Loading papers...")
    );
    const message = await page.$eval(
      "h2:nth-of-type(2) + div",
      (el) => el.textContent
    );
    expect(message).toBe("No papers found");
  });

  test("Create paper form validates empty title", async () => {
    await page.type('input[name="publishedIn"]', "IEEE");
    await page.type('input[name="year"]', "2024");
    await page.click('button[type="submit"]');

    const error = await page.$eval(".error", (el) => el.textContent);
    expect(error).toBe("Title is required");
  });

  test("Create paper successfully", async () => {
    const authorRes = await fetch("http://localhost:3000/api/authors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        affiliation: "UofT",
      }),
    });
    const { id } = await authorRes.json();

    // Reload the page and wait for the form to be ready
    await page.reload();
    await page.waitForSelector("select"); // Ensure the author dropdown is loaded

    // Fill out and submit the form
    await page.type('input[name="title"]', "Test Paper");
    await page.type('input[name="publishedIn"]', "IEEE");
    await page.type('input[name="year"]', "2023");
    await page.select("select", String(id));
    await page.click('button[type="submit"]');

    // Wait for the success message
    const success = await waitForSuccessMessage(
      page,
      "Paper created successfully"
    );
    expect(success).toBe("Paper created successfully");

    // Verify paper appears in the list
    await page.waitForFunction(
      () => {
        const titles = Array.from(document.querySelectorAll("h3"));
        return titles.some((h3) => h3.textContent.trim() === "Test Paper");
      },
      { timeout: 5000 }
    );
    const paperTitles = await page.$$eval("h3", (els) =>
      els.map((el) => el.textContent.trim())
    );
    expect(paperTitles).toContain("Test Paper");
  });

  test("Edit paper navigates and updates", async () => {
    const paperData = {
      title: "Original Paper",
      publishedIn: "ACM",
      year: 2022,
      authors: [
        { name: "Jane Doe", email: "jane@example.com", affiliation: "UofT" },
      ],
    };
    const res = await fetch("http://localhost:3000/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paperData),
    });
    const { id } = await res.json();

    // Navigate to edit page and wait for it to load
    await page.goto(`http://localhost:5173/edit/${id}`);
    await page.waitForFunction(
      () =>
        document.querySelector("h1") ||
        document.querySelector("div")?.textContent ===
          "Loading paper details...",
      { timeout: 5000 }
    );
    await page.waitForFunction(
      () => document.querySelector("h1")?.textContent === "Edit Paper",
      { timeout: 5000 }
    );

    // Verify heading
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("Edit Paper");

    // Update the title and submit
    await page.evaluate(
      () => (document.querySelector('input[name="title"]').value = "")
    );
    await page.type('input[name="title"]', "Updated Paper");
    await page.click('button[type="submit"]');

    // Verify success message on edit page
    const success = await waitForSuccessMessage(
      page,
      "Paper updated successfully"
    );
    expect(success).toBe("Paper updated successfully");

    // Wait for navigation to home page
    await page.waitForNavigation({ timeout: 6000 });

    // Wait for paper list to load
    await page.waitForFunction(
      () => {
        const paperTitles = Array.from(document.querySelectorAll("h3"));
        return (
          paperTitles.some((h3) => h3.textContent.trim() === "Updated Paper") ||
          document.querySelector("div")?.textContent.includes("No papers found")
        );
      },
      { timeout: 5000 }
    );

    // Check if the updated paper title is present
    const paperTitles = await page.$$eval("h3", (els) =>
      els.map((el) => el.textContent.trim())
    );
    expect(paperTitles).toContain("Updated Paper");
  });

  test("Delete paper with confirmation", async () => {
    // Mock the confirmation dialog to auto-accept
    await page.evaluate(() => {
      window.confirm = () => true; // Automatically confirm deletion
    });

    // Find all buttons, then filter for the one with text "Delete"
    const deleteButtons = await page.$$("button");
    let deleteButton = null;
    for (const btn of deleteButtons) {
      const text = await btn.evaluate((el) => el.textContent.trim());
      if (text === "Delete") {
        deleteButton = btn;
        break;
      }
    }
    await deleteButton.click();

    // Verify the success message is present
    const success = await waitForSuccessMessage(
      page,
      "Paper deleted successfully"
    );
    expect(success).toBe("Paper deleted successfully");
  });
});
