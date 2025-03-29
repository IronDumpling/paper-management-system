const { execSync } = require("child_process");
const puppeteer = require("puppeteer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Increase timeout for slower systems or network delays
jest.setTimeout(30000);

// Helper to wait for and verify success/error messages
async function waitForMessage(page, message, timeout = 5000) {
  await page.waitForFunction(
    (msg) => {
      const elements = Array.from(
        document.querySelectorAll("[data-testid='status-message'], p")
      );
      return elements.some((el) => el.textContent.trim() === msg);
    },
    { timeout },
    message
  );
  const foundMessage = await page.evaluate((msg) => {
    const elements = Array.from(
      document.querySelectorAll("[data-testid='status-message'], p")
    );
    const target = elements.find((el) => el.textContent.trim() === msg);
    return target ? target.textContent.trim() : null;
  }, message);
  return foundMessage;
}

// Helper to reset PostgreSQL database
async function resetDatabase() {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "Paper" RESTART IDENTITY CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Author" RESTART IDENTITY CASCADE;`;
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

describe("Assignment 4: Full-Stack Next.js Application", () => {
  let browser;
  let page;

  beforeAll(async () => {
    await resetDatabase();

    browser = await puppeteer.launch({
      headless: false, // Open a visible browser window
      slowMo: 100, // Slow down actions by 100ms for easier observation
      devtools: true, // Open Chrome DevTools for debugging
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await browser.close();
  });

  test("Home page displays correct layout and empty state", async () => {
    await page.waitForSelector("h1"); // Ensure page is loaded
    const title = await page.$eval("h1", (el) => el.textContent);
    const papersHeading = await page.$eval("h2", (el) => el.textContent);
    const createPaperLink = await page.$eval(
      "a[href='/papers/create']",
      (el) => el.textContent
    );
    const createAuthorLink = await page.$eval(
      "a[href='/authors/create']",
      (el) => el.textContent
    );

    expect(title).toBe("Paper Management System");
    expect(papersHeading).toBe("Papers");
    expect(createPaperLink).toBe("Create New Paper");
    expect(createAuthorLink).toBe("Create New Author");

    // Check empty state with Suspense fallback
    await page.waitForFunction(
      () => document.querySelector("p")?.textContent !== "Loading papers..."
    );
    const emptyMessage = await page.$eval("p", (el) => el.textContent);
    expect(emptyMessage).toBe("No papers found");
  });

  test("Create author successfully", async () => {
    await page.goto("http://localhost:3000/authors/create");
    await page.waitForSelector("h1");
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("Create New Author");

    // Fill out and submit the form
    await page.type('input[name="name"]', "Jane Doe");
    await page.type('input[name="email"]', "jane@example.com");
    await page.type('input[name="affiliation"]', "UofT");
    await page.click('[data-testid="create-author-btn"]');

    // Verify success message and redirect
    const success = await waitForMessage(page, "Author created successfully");
    expect(success).toBe("Author created successfully");

    // Wait for redirect to home page (3 seconds delay)
    await page.waitForNavigation({ timeout: 6000 });
    expect(page.url()).toBe("http://localhost:3000/");
  });

  test("Create paper form validates empty title", async () => {
    await page.goto("http://localhost:3000/papers/create");
    await page.waitForSelector("h1");
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("Create New Paper");

    // Submit empty form
    await page.click('[data-testid="create-paper-btn"]');
    const error = await waitForMessage(page, "Title is required");
    expect(error).toBe("Title is required");
  });

  test("Create paper successfully with existing author", async () => {
    // Seed an author
    const author = await prisma.author.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        affiliation: "UofT",
      },
    });

    await page.goto("http://localhost:3000/papers/create");
    await page.waitForSelector('[data-testid="author-dropdown"]');

    // Fill out and submit the form
    await page.type('input[name="title"]', "Test Paper");
    await page.type('input[name="publishedIn"]', "IEEE");
    await page.type('input[name="year"]', "2025");
    await page.select('[data-testid="author-dropdown"]', String(author.id));
    await page.click('[data-testid="create-paper-btn"]');

    // Verify success message and redirect
    const success = await waitForMessage(page, "Paper created successfully");
    expect(success).toBe("Paper created successfully");

    // Wait for redirect to home page (3 seconds delay)
    await page.waitForNavigation({ timeout: 6000 });
    expect(page.url()).toBe("http://localhost:3000/");

    // Verify paper appears in list
    await page.waitForFunction(
      () => {
        const titles = Array.from(
          document.querySelectorAll(".text-xl.font-semibold")
        );
        return titles.some((el) => el.textContent.trim() === "Test Paper");
      },
      { timeout: 5000 }
    );
    const paperTitles = await page.$$eval(".text-xl.font-semibold", (els) =>
      els.map((el) => el.textContent.trim())
    );
    expect(paperTitles).toContain("Test Paper");
  });

  test("API route fetches papers correctly", async () => {
    const author = await prisma.author.create({
      data: {
        name: "Alice Smith",
        email: "alice@example.com",
        affiliation: "UofT",
      },
    });
    await prisma.paper.create({
      data: {
        title: "Sample Paper",
        publishedIn: "ACM",
        year: 2024,
        authors: { connect: { id: author.id } },
      },
    });

    await page.goto("http://localhost:3000");
    await page.waitForFunction(
      () => document.querySelector("p")?.textContent !== "Loading papers..."
    );

    const paperTitles = await page.$$eval(".text-xl.font-semibold", (els) =>
      els.map((el) => el.textContent.trim())
    );
    expect(paperTitles).toContain("Sample Paper");

    const authors = await page.$$eval(
      ".text-xl.font-semibold + p + p + p",
      (els) => els.map((el) => el.textContent.trim())
    );
    expect(authors).toContain("Authors: Alice Smith");
  });

  test("Home page shows error on API failure", async () => {
    try {
      // Simulate database failure by stopping PostgreSQL
      // Note: This uses Homebrew and PostgreSQL v16, please adjust if you use others
      execSync("brew services stop postgresql@16");

      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

      // Wait for the error message to appear
      await page.waitForSelector('[data-testid="papers-error"]', {
        timeout: 5000,
      });

      const error = await page.$eval(
        '[data-testid="papers-error"]',
        (el) => el.textContent
      );
      expect(error).toBe("Error loading papers");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    } finally {
      // Restart PostgreSQL after this test case
      try {
        // Use corresponding start command for your setup
        execSync("brew services start postgresql@16");
        console.log("PostgreSQL restarted successfully");

        // Allow time for database to fully initialize
        // Note: Increase if your system needs longer startup
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (restartError) {
        console.error("Failed to restart PostgreSQL:", restartError);
      }
    }
  });
});
