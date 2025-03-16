const request = require("supertest");
const app = require("../src/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TEST_AUTHORS = {
  johnDoe: {
    name: "John Doe",
    email: "john@utoronto.ca",
    affiliation: "University of Toronto"
  },
  janeSmith: {
    name: "Jane Smith",
    email: "jane@mit.edu",
    affiliation: "MIT"
  },
  bobJohnson: {
    name: "Bob Johnson",
    affiliation: "Stanford University"
  },
  aliceBrown: {
    name: "Alice Brown",
    email: "alice@stanford.edu"
  },
  charlieCase: {
    name: "Charlie Case",
    affiliation: "U of T"
  }
};

const TEST_PAPERS = {
  paper1: {
    title: "Advanced Quantum Computing",
    publishedIn: "Science Journal",
    year: 2023
  },
  paper2: {
    title: "Machine Learning Trends",
    publishedIn: "AI Conference",
    year: 2024
  }
};

// Clean up before all tests
beforeAll(async () => {
  await prisma.paper.deleteMany();
  await prisma.author.deleteMany();

  // Create authors
  const authors = await prisma.author.createMany({
    data: Object.values(TEST_AUTHORS)
  });

  // Get created author IDs
  const createdAuthors = await prisma.author.findMany();
  const authorIds = createdAuthors.reduce((acc, author) => {
    acc[author.name] = author.id;
    return acc;
  }, {});

  // Create papers with author relationships
  await prisma.paper.create({
    data: {
      ...TEST_PAPERS.paper1,
      authors: {
        connect: [
          { id: authorIds["John Doe"] },
          { id: authorIds["Jane Smith"] }
        ]
      }
    }
  });

  await prisma.paper.create({
    data: {
      ...TEST_PAPERS.paper2,
      authors: {
        connect: [
          { id: authorIds["Bob Johnson"] },
          { id: authorIds["Alice Brown"] },
          { id: authorIds["Charlie Case"] }
        ]
      }
    }
  });

  // Create a paper with single author for constraint testing
  await prisma.paper.create({
    data: {
      title: "Sole Author Paper",
      publishedIn: "Test Journal",
      year: 2023,
      authors: {
        connect: { id: authorIds["John Doe"] }
      }
    }
  });
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe("API Tests for Author Routes", () => {
  describe("Edge Cases", () => {
    it("POST should reject empty name with whitespace only", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ name: "   " });
      
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Name is required");
    });
  
    it("GET should handle maximum limit parameter", async () => {
      const res = await request(app)
        .get("/api/authors?limit=100");
      
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(100);
      expect(res.body.authors.length).toBeLessThanOrEqual(100);
    });
  
    it("GET should return 400 for negative offset", async () => {
      const res = await request(app)
        .get("/api/authors?offset=-1");
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid query parameter format");
    });
  
    it("GET should filter by combined name and affiliation", async () => {
      const res = await request(app)
        .get("/api/authors?name=john&affiliation=toronto");
      
      expect(res.status).toBe(200);
      expect(res.body.authors).toHaveLength(1);
      expect(res.body.authors[0].name).toBe("John Doe");
    });
  
    it("GET should return empty array for no matches", async () => {
      const res = await request(app)
        .get("/api/authors?name=nonexistent");
      
      expect(res.status).toBe(200);
      expect(res.body.authors).toHaveLength(0);
    });
  
    it("PUT should preserve existing papers on update", async () => {
      const author = await prisma.author.findFirst({
        where: { name: "John Doe" }
      });
      
      const res = await request(app)
        .put(`/api/authors/${author.id}`)
        .send({ name: "John Updated" });
      
      expect(res.status).toBe(200);
      expect(res.body.papers.length).toBeGreaterThan(0);
    });
  
    it("DELETE should block sole author deletion", async () => {
      const author = await prisma.author.findFirst({
        where: { name: "John Doe" }
      });
      
      const res = await request(app)
        .delete(`/api/authors/${author.id}`);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Cannot delete author");
    });
  
    it("DELETE should allow multi-author paper deletion", async () => {
      const author = await prisma.author.findFirst({
        where: { name: "Jane Smith" }
      });
      
      const res = await request(app)
        .delete(`/api/authors/${author.id}`);
      
      expect(res.status).toBe(204);
    });
  
    it("GET should order authors by ascending ID", async () => {
      const res = await request(app).get("/api/authors");
      const ids = res.body.authors.map(a => a.id);
      
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });
  
    it("GET should order papers by ascending ID", async () => {
      const author = await prisma.author.findFirst({
        where: { name: "Bob Johnson" }
      });
      
      const res = await request(app)
        .get(`/api/authors/${author.id}`);
      
      const paperIds = res.body.papers.map(p => p.id);
      expect(paperIds).toEqual([...paperIds].sort((a, b) => a - b));
    });
  
    it("POST should ignore extra fields in request", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ 
          name: "Test Author",
          extraField: "should be ignored" 
        });
      
      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("extraField");
    });
  
    it("PUT should validate ID before request body", async () => {
      const res = await request(app)
        .put("/api/authors/invalid_id")
        .send({ invalidBody: true });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid ID format");
    });
  
    it("GET should handle special characters in filters", async () => {
      const res = await request(app)
        .get("/api/authors?name=Doe%20John&affiliation=Tor%20");
      
      expect(res.status).toBe(200);
      expect(res.body.authors.length).toBeGreaterThanOrEqual(1);
    });
  
    it("GET should validate limit parameter type", async () => {
      const res = await request(app)
        .get("/api/authors?limit=not_a_number");
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid query parameter format");
    });
  
    it("GET should return correct pagination metadata", async () => {
      const res = await request(app)
        .get("/api/authors?limit=2&offset=1");
      
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(1);
      expect(res.body.authors.length).toBe(2);
    });
  });
});
