const request = require("supertest");
const app = require("../src/server");
const { db } = require("../src/database");

const samplePaper = {
  title: "Chuyue Paper Title",
  authors: "Chuyue Zhang, Charlie Zhang",
  published_in: "ICSE 2020",
  year: 2020,
};

describe("API Corner Case Tests", () => {
  let createdPaperId;

  beforeAll(async () => {
    // Create a test paper to use in multiple tests
    const res = await request(app).post("/api/papers").send(samplePaper);
    createdPaperId = res.body.id;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM papers", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe("POST /api/papers", () => {
    it("should return 400 for year as invalid string", async () => {
      const res = await request(app)
        .post("/api/papers")
        .send({ ...samplePaper, year: "nineteen" });
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Valid year after 1900 is required");
    });

    it("shouldn preserve whitespace from string fields", async () => {
      const res = await request(app).post("/api/papers").send({
        title: "  Title with spaces  ",
        authors: "  Author 1, Author 2  ",
        published_in: "  Venue  ",
        year: 2025
      });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("  Title with spaces  ");
      expect(res.body.authors).toBe("  Author 1, Author 2  ");
      expect(res.body.published_in).toBe("  Venue  ");
    });

    it("should return 400 for empty title field", async () => {
      const res = await request(app).post("/api/papers").send({
        title: "  Title with spaces  ",
        authors: "           ",
        published_in: "  Venue  ",
        year: 2025
      });
      expect(res.status).toBe(400);
      expect(res.body.messages).toEqual([
        "Authors are required"
      ]);
    });

    it("should return 400 for year 1900", async () => {
      const res = await request(app)
        .post("/api/papers")
        .send({ ...samplePaper, year: 1900 });
      expect(res.status).toBe(400);
      expect(res.body.messages).toContain("Valid year after 1900 is required");
    });

    it("should ignore extra fields in request body", async () => {
      const res = await request(app).post("/api/papers").send({
        ...samplePaper,
        extraField: "should be ignored"
      });
      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("extraField");
    });
  });

  describe("GET /api/papers", () => {
    it("should return 400 for invalid limit parameter", async () => {
      const res = await request(app).get("/api/papers?limit=invalid");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid query parameter format");
    });

    it("should return 400 for negative offset", async () => {
      const res = await request(app).get("/api/papers?offset=-1");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid query parameter format");
    });

    it("should handle case-insensitive published_in filter", async () => {
      const res = await request(app).get("/api/papers?published_in=icse");
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching filters", async () => {
      const res = await request(app).get("/api/papers?year=2100");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /api/papers/:id", () => {
    it("should return 400 for non-integer ID", async () => {
      const res = await request(app).get("/api/papers/abc");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 for zero ID", async () => {
      const res = await request(app).get("/api/papers/0");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should maintain created_at after updates", async () => {
      const original = await request(app).get(`/api/papers/${createdPaperId}`);
      await request(app)
        .put(`/api/papers/${createdPaperId}`)
        .send({ ...samplePaper, title: "Updated Title" });
      const updated = await request(app).get(`/api/papers/${createdPaperId}`);
      expect(updated.body.created_at).toBe(original.body.created_at);
    });
  });

  describe("PUT /api/papers/:id", () => {
    it("should return 400 when updating with missing all fields", async () => {
      const res = await request(app)
        .put(`/api/papers/${createdPaperId}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required"
      ]);
    });

    it("should update timestamp on successful update", async () => {
      const original = await request(app).get(`/api/papers/${createdPaperId}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Ensure timestamp difference
      const res = await request(app)
        .put(`/api/papers/${createdPaperId}`)
        .send({ ...samplePaper, title: "Updated Title" });
      expect(res.body.updated_at).not.toBe(original.body.updated_at);
    });

    it("should return 400 for invalid ID format", async () => {
      const res = await request(app)
        .put("/api/papers/invalid")
        .send(samplePaper);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });
  });

  describe("DELETE /api/papers/:id", () => {
    it("should return 404 when deleting non-existent paper", async () => {
      const res = await request(app).delete("/api/papers/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });

    it("should return 400 for invalid ID format", async () => {
      const res = await request(app).delete("/api/papers/invalid");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should prevent duplicate deletions", async () => {
      // Create and delete a paper
      const createRes = await request(app).post("/api/papers").send(samplePaper);
      await request(app).delete(`/api/papers/${createRes.body.id}`);
      const deleteRes = await request(app).delete(`/api/papers/${createRes.body.id}`);
      expect(deleteRes.status).toBe(404);
    });
  });
});