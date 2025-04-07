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

  test("Create paper fails if year is missing", async () => {
    await page.goto("http://localhost:3000/papers/create");
    await page.type('input[name="title"]', "Year Missing Test");
    await page.type('input[name="publishedIn"]', "IEEE");
    await page.evaluate(() => {
      document.querySelector('input[name="year"]').value = "";
    });
    await page.click('[data-testid="create-paper-btn"]');
    const error = await waitForMessage(page, "Publication year is required");
    expect(error).toBe("Publication year is required");
  });

  test("Create paper fails if year is invalid (<1901)", async () => {
    await page.goto("http://localhost:3000/papers/create");
    await page.type('input[name="title"]', "Invalid Year Test");
    await page.type('input[name="publishedIn"]', "IEEE");
    await page.type('input[name="year"]', "1800");
    await page.click('[data-testid="create-paper-btn"]');
    const error = await waitForMessage(page, "Valid year after 1900 is required");
    expect(error).toBe("Valid year after 1900 is required");
  });

  test("Create paper fails if publication venue is missing", async () => {
    await page.goto("http://localhost:3000/papers/create");
    await page.type('input[name="title"]', "Missing Venue Test");
    await page.type('input[name="year"]', "2023");
    await page.click('[data-testid="create-paper-btn"]');
    const error = await waitForMessage(page, "Publication venue is required");
    expect(error).toBe("Publication venue is required");
  });

  test("Create paper fails if no authors selected", async () => {
    await page.goto("http://localhost:3000/papers/create");
    await page.type('input[name="title"]', "Missing Authors Test");
    await page.type('input[name="publishedIn"]', "ACM");
    await page.type('input[name="year"]', "2024");
    // Don't select any authors
    await page.click('[data-testid="create-paper-btn"]');
    const error = await waitForMessage(page, "Please select at least one author");
    expect(error).toBe("Please select at least one author");
  });

  test("Create author fails if name is missing", async () => {
    await page.goto("http://localhost:3000/authors/create");
    await page.evaluate(() => {
      document.querySelector('input[name="name"]').value = "";
    });
    await page.click('[data-testid="create-author-btn"]');
    const error = await waitForMessage(page, "Name is required");
    expect(error).toBe("Name is required");
  });

  test("Create and display 10 authors and 10 papers", async () => {
    const authors = [];
  
    // Create 10 authors in the database directly via Prisma
    for (let i = 1; i <= 10; i++) {
      const author = await prisma.author.create({
        data: {
          name: `Author ${i}`,
          email: `author${i}@example.com`,
          affiliation: `University ${i}`,
        },
      });
      authors.push(author);
    }
  
    // Create 10 papers with alternating author combinations
    for (let i = 1; i <= 10; i++) {
      const paperAuthors = i % 2 === 0
        ? [authors[i - 1]]
        : [authors[i - 1], authors[(i - 1 + 1) % 10]];
  
      await prisma.paper.create({
        data: {
          title: `Paper ${i}`,
          publishedIn: i % 2 === 0 ? "IEEE" : "ACM",
          year: 2020 + i,
          authors: {
            connect: paperAuthors.map((a) => ({ id: a.id })),
          },
        },
      });
    }
  
    // Go to home page to view the paper list
    await page.goto("http://localhost:3000");
  
    // Wait until papers are rendered
    await page.waitForFunction(() => {
      const items = document.querySelectorAll("[data-testid='paper-list'] li");
      return items.length >= 10;
    }, { timeout: 6000 });
  
    const paperTitles = await page.$$eval("h3.text-xl.font-semibold", (els) =>
      els.map((el) => el.textContent.trim())
    );
  
    for (let i = 1; i <= 10; i++) {
      expect(paperTitles).toContain(`Paper ${i}`);
    }
  });
  
});
