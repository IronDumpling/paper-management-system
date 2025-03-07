const request = require("supertest");
const app = require("../src/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sampleAuthor = {
  name: "John Doe",
  email: "john.doe@example.com",
};

// Clean up before all tests
beforeAll(async () => {
  await prisma.paper.deleteMany();
  await prisma.author.deleteMany();
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe("API Tests for Author Routes", () => {
  // POST /api/authors
  describe("POST /api/authors", () => {
    it("should create a new author with valid input", async () => {
      const res = await request(app).post("/api/authors").send(sampleAuthor);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(sampleAuthor);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("createdAt");
      expect(res.body).toHaveProperty("updatedAt");
      expect(res.body).toHaveProperty("papers");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/authors").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Name is required"]);
    });

    // Extra Tests
    it("should ignore extra fields in request body", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ ...sampleAuthor, extraField: "should be ignored" });
  
      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("extraField");
    });
  
    it("should return 400 if name is empty string", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ name: "" });
  
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Name is required");
    });
  
    it("should return 400 if name is only whitespace", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ name: "   " });
  
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Name is required");
    });
  });

  // GET /api/authors
  describe("GET /api/authors", () => {
    it("should retrieve a list of authors with correct response structure", async () => {
      const res = await request(app).get("/api/authors");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("authors");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("limit");
      expect(res.body).toHaveProperty("offset");

      expect(Array.isArray(res.body.authors)).toBeTruthy();
      expect(typeof res.body.total).toBe("number");
      expect(typeof res.body.limit).toBe("number");
      expect(typeof res.body.offset).toBe("number");
    });

    it("should filter authors by case-insensitive partial name match", async () => {
      const res = await request(app).get("/api/authors?name=jOh");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("authors");
      expect(Array.isArray(res.body.authors)).toBeTruthy();
      expect(res.body.authors.length).toBeGreaterThan(0);

      // Verify that all returned authors contain "jOh" (case-insensitive) in their name
      res.body.authors.forEach((author) => {
        expect(author.name.toLowerCase()).toContain("joh");
      });
    });

    // Extra Tests
    it("should handle maximum limit value", async () => {
      // Create 105 authors
      await Promise.all(
        Array.from({ length: 105 }, (_, i) => 
          prisma.author.create({ data: { name: `Author ${i}` } })
      ));
  
      const res = await request(app).get("/api/authors?limit=100");
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(100);
      expect(res.body.authors.length).toBe(100);
    });
  
    it("should return 400 for invalid limit", async () => {
      const res = await request(app).get("/api/authors?limit=invalid");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid query parameter format");
    });
  
    it("should combine multiple filters with AND logic", async () => {
      await prisma.author.create({
        data: {
          name: "John Smith",
          affiliation: "University of Toronto"
        }
      });
  
      const res = await request(app)
        .get("/api/authors?name=john&affiliation=toronto");
  
      expect(res.status).toBe(200);
      expect(res.body.authors.length).toBe(1);
    });
  });

  // GET /api/authors/:id
  describe("GET /api/authors/:id", () => {
    it("should retrieve an author by ID", async () => {
      const createRes = await request(app)
        .post("/api/authors")
        .send(sampleAuthor);
      const res = await request(app).get(`/api/authors/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(createRes.body);
    });

    it("should return 404 if author is not found", async () => {
      const res = await request(app).get("/api/authors/99999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });

    // Extra Tests
    it("should return 400 for invalid ID format", async () => {
      const res = await request(app).get("/api/authors/invalid_id");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });
  
    it("should return papers ordered by ascending id", async () => {
      const author = await prisma.author.create({
        data: {
          name: "Test Author",
          papers: {
            create: [
              { title: "Paper B", publishedIn: "Journal", year: 2023 },
              { title: "Paper A", publishedIn: "Conference", year: 2022 }
            ]
          }
        },
        include: { papers: true }
      });
  
      const res = await request(app).get(`/api/authors/${author.id}`);
      expect(res.status).toBe(200);
      expect(res.body.papers.map(p => p.id)).toEqual([
        author.papers[0].id,
        author.papers[1].id
      ].sort((a, b) => a - b));
    });
  });

  // PUT /api/authors/:id
  describe("PUT /api/authors/:id", () => {
    it("should update an existing author", async () => {
      const createRes = await request(app)
        .post("/api/authors")
        .send(sampleAuthor);
      const updatedAuthor = {
        name: "Updated Author",
        email: "updated.author@example.com",
        affiliation: "Updated University",
      };
      const res = await request(app)
        .put(`/api/authors/${createRes.body.id}`)
        .send(updatedAuthor);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(updatedAuthor);
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("should return 404 if author is not found", async () => {
      const res = await request(app)
        .put("/api/authors/99999")
        .send(sampleAuthor);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });

    // Extra Tests
    it("should return 400 if ID is invalid format", async () => {
      const res = await request(app)
        .put("/api/authors/invalid_id")
        .send({ name: "Updated" });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });
  
    it("should preserve existing papers when updating", async () => {
      const author = await prisma.author.create({
        data: {
          name: "Original Author",
          papers: { create: { title: "Test Paper", publishedIn: "Conf", year: 2023 } }
        },
        include: { papers: true }
      });
  
      const res = await request(app)
        .put(`/api/authors/${author.id}`)
        .send({ name: "Updated Author" });
  
      expect(res.status).toBe(200);
      expect(res.body.papers.length).toBe(1);
      expect(res.body.papers[0].id).toBe(author.papers[0].id);
    });
  
    it("should return 400 if name is empty string", async () => {
      const author = await prisma.author.create({ data: { name: "Test Author" } });
      const res = await request(app)
        .put(`/api/authors/${author.id}`)
        .send({ name: "" });
  
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Name is required");
    });
  });

  // DELETE /api/authors/:id
  describe("DELETE /api/authors/:id", () => {
    it("should delete an author by ID", async () => {
      const createRes = await request(app)
        .post("/api/authors")
        .send(sampleAuthor);
      const res = await request(app).delete(
        `/api/authors/${createRes.body.id}`
      );

      expect(res.status).toBe(204);

      const getRes = await request(app).get(
        `/api/authors/${createRes.body.id}`
      );
      expect(getRes.status).toBe(404);
    });

    it("should return 404 if author is not found", async () => {
      const res = await request(app).delete("/api/authors/99999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });

    // Extra Tests
    it("should return 400 if author is sole author of paper", async () => {
      const author = await prisma.author.create({
        data: {
          name: "Sole Author",
          papers: { create: { title: "Sole Paper", publishedIn: "Journal", year: 2023 } }
        }
      });
  
      const res = await request(app).delete(`/api/authors/${author.id}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Cannot delete author");
    });
  
    it("should allow deletion if paper has multiple authors", async () => {
      const paper = await prisma.paper.create({
        data: {
          title: "Multi-author Paper",
          publishedIn: "Conference",
          year: 2023,
          authors: {
            create: [
              { name: "Author 1" },
              { name: "Author 2" }
            ]
          }
        },
        include: { authors: true }
      });
  
      const res = await request(app).delete(`/api/authors/${paper.authors[0].id}`);
      expect(res.status).toBe(204);
    });
  
    it("should return 400 for invalid ID format", async () => {
      const res = await request(app).delete("/api/authors/not_a_number");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long affiliation field", async () => {
      const longAffiliation = "A".repeat(500);
      const res = await request(app)
        .post("/api/authors")
        .send({ name: "Long Affiliation", affiliation: longAffiliation });
  
      expect(res.status).toBe(201);
      expect(res.body.affiliation).toBe(longAffiliation);
    });
  
    it("should handle special characters in name", async () => {
      const name = "Dr. María Sánchez-Gómez";
      const res = await request(app)
        .post("/api/authors")
        .send({ name });
  
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(name);
    });
  
    it("should return empty papers array for new author", async () => {
      const res = await request(app)
        .post("/api/authors")
        .send({ name: "New Author" });
  
      expect(res.status).toBe(201);
      expect(res.body.papers).toEqual([]);
    });
  
    it("should maintain createdAt timestamp on update", async () => {
      const author = await prisma.author.create({ data: { name: "Timestamp Test" } });
      const res = await request(app)
        .put(`/api/authors/${author.id}`)
        .send({ name: "Updated Name" });
  
      expect(res.status).toBe(200);
      expect(new Date(res.body.createdAt)).toEqual(author.createdAt);
      expect(new Date(res.body.updatedAt)).not.toEqual(author.updatedAt);
    });
  
    // it("should handle pagination metadata correctly", async () => {
    //   // Create 15 authors
    //   await Promise.all(
    //     Array.from({ length: 15 }, (_, i) => 
    //       prisma.author.create({ data: { name: `Paginated Author ${i}` } })
    //   ));
  
    //   const res = await request(app).get("/api/authors?limit=5&offset=10");
    //   expect(res.status).toBe(200);
    //   expect(res.body.limit).toBe(5);
    //   expect(res.body.offset).toBe(10);
    //   expect(res.body.total).toBe(15);
    //   expect(res.body.authors.length).toBe(5);
    // });
  });
});
