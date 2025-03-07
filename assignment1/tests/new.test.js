const request = require("supertest");
const app = require("../src/server");
const { db } = require("../src/database");


// POST /api/papers
const samplePaper = {
  title: "Sample Paper Title",
  authors: "John Doe, Jane Smith",
  published_in: "ICSE 2024",
  year: 2024,
};

const whiteSpacePaper = {
  title: "",
  authors: "      ",
  published_in: "  ",
  year: 2024,
};

const whiteTrailWrongYearPaper = {
  title: "   Attention is wanted",
  authors: "    jj,  n      LL,   ", 
  published_in: " n n n n n n ",
  year: 31
};

const whiteTrailPaper = {
  title: "   Attention is wanted",
  authors: "    jj,  n      LL,   ", 
  published_in: " n n n n n n ",
  year: 2022
};

const missingTitle = {
  authors: "sam, burton", 
  published_in: "IEEE",
  year: 2022
};

const stringAreNumbers = {
  title: 1111,
  authors: 1111, 
  published_in: 1111,
  year: "2002"
};

const stringAreNumbersWithFloatYear = {
  title: 1111,
  authors: 1111, 
  published_in: 1111,
  year: 20002.4141,
};

const nullInAll = {
  title: null,
  authors: null, 
  published_in: null,
  year: null,
};

const undefinedInAll = {
  title: undefined,
  authors: undefined, 
  published_in: undefined,
  year: undefined,
};

const nullString = {
  title: "null",
  authors: "null",
  published_in: "null",
  year: "null"
};

const undefinedString = {
  title: "undefined",
  authors: "undefined",
  published_in: "undefined",
  year: "undefined"
}

const samplePaperExtraKey = {
  title: "Sample Paper Title",
  authors: "John Doe, Jane Smith",
  published_in: "ICSE 2024",
  year: 2024,
  note: "I am free!!!!"
};

// Clean up before all tests
beforeAll(async () => {
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM papers", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

// Clean up after all tests
afterAll(async () => {
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

describe("Paper Management API Tests", () => {
  // POST /api/papers
  describe("POST /api/papers", () => {
    // Add a new paper
    it("should create a new paper with valid input", async () => {
      const res = await request(app).post("/api/papers").send(samplePaper);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: samplePaper.title,
        authors: samplePaper.authors,
        published_in: samplePaper.published_in,
        year: samplePaper.year,
      });
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("created_at");
      expect(res.body).toHaveProperty("updated_at");
    });

    //all fields are missing
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/papers").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required",
      ]);
    });

    // invalid year
    it("should return 400 if year is invalid", async () => {
      const res = await request(app)
        .post("/api/papers")
        .send({ ...samplePaper, year: 1900 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Valid year after 1900 is required"]);
    });

    // white space title, authors, and published_in, year is valid
    it("return 400 if required string fields are white spaces", async() => {
      const res = await request(app).post('/api/papers').send(whiteSpacePaper);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
      ]);
    });

    // white space everywhere but not empty
    it("return 200 for white space trailing but not empty", async() => {
      const res = await request(app).post('/api/papers').send(whiteTrailPaper);
      
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: whiteTrailPaper.title,
        authors: whiteTrailPaper.authors,
        published_in: whiteTrailPaper.published_in,
        year: whiteTrailPaper.year,
      });
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("created_at");
      expect(res.body).toHaveProperty("updated_at");
    });

    // wrong year 2
    it("return 400 if wrong year despite accepting white space trailed", async() => {
      const res = await request(app).post('/api/papers').send(whiteTrailWrongYearPaper);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Valid year after 1900 is required"
      ]);
    });

    // missing title
    it("return 400, title attribute is missing", async() => {
      const res = await request(app).post('/api/papers').send(missingTitle);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
      ]);
    });
  
    // string fields are numbers, year is string
    it("return 400, wrong param type", async() => {
      const res = await request(app).post('/api/papers').send(stringAreNumbers);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required",
      ]);
    });

    // string fields are numbers, year is float
    it("return 400, wrong param type", async() => {
      const res = await request(app).post('/api/papers').send(stringAreNumbersWithFloatYear);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required",
      ]);
    });

    // null in all field
    it("return 400 when attribute is all null", async() => {
      const res = await request(app).post('/api/papers').send(nullInAll);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required",
      ]);
    });

    // null string in all field
    it("return 400 when attribute is all string null", async() => {
      const res = await request(app).post('/api/papers').send(nullString);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Published year is required",
      ]);
    });

    // undefined in all field
    it("return 400 when attribute is all undefined", async() => {
      const res = await request(app).post('/api/papers').send(undefinedInAll);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published venue is required",
        "Published year is required",
      ]);
    });

    // undefined string ini all field
    it("return 400 when attribute is all string undefined", async() => {
      const res = await request(app).post('/api/papers').send(undefinedString);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Published year is required",
      ]);
    });

    // Add a new paper regardless of having an extra attribute
    it("add a new paper regardless extra aattribute", async () => {
      const res = await request(app).post("/api/papers").send(samplePaperExtraKey);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: samplePaperExtraKey.title,
        authors: samplePaperExtraKey.authors,
        published_in: samplePaperExtraKey.published_in,
        year: samplePaperExtraKey.year,
      });
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("created_at");
      expect(res.body).toHaveProperty("updated_at");
    });
  
    
  });

  // GET /api/papers
  describe("GET /api/papers", () => {
    // default case
    it("should retrieve a list of papers", async () => {
      const res = await request(app).get("/api/papers");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // applying filters
    it("should apply filters correctly", async () => {
      const res = await request(app).get(
        "/api/papers?year=2024&published_in=ICSE"
      );

      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.year).toBe(2024);
        expect(paper.published_in).toMatch(/ICSE/i);
      });
    });

    // year is negative
    it("return 400 when year is negative", async() => {
      const res = await request(app).get(
        "/api/papers?year=-12"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // year is smaller 1900
    it("return 400 when year is smaller than 1900", async() => {
      const res = await request(app).get(
        "/api/papers?year=1800"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // year is float
    it("return 400 when year is float", async() => {
      const res = await request(app).get(
        "/api/papers?year=3.3"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // year is string
    it("return 400 when year is string", async() => {
      const res = await request(app).get(
        "/api/papers?year=Iadadad"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    it("return 400 when year is undefined", async() => {
      const res = await request(app).get(
        "/api/papers?year=undefined"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });
    
    // year is empty (year=)
    it("return 200 when year is year=", async () => {
      const res = await request(app).get("/api/papers?year=");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // year does not exist 200000 but int, so should return an empty array
    it("return 200 when year is very large", async () => {
      const res = await request(app).get("/api/papers?year=200000");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(0);
    });


    // pi is empty
    it("return 200 when pi is not provided", async () => {
      const res = await request(app).get("/api/papers");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // pi is empty space 
    it("return 200 when pi is published_in=", async () => {
      const res = await request(app).get("/api/papers?published_in=");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // match string ICSE
    it("should apply pi filters correctly", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=ICSE"
      );

      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/ICSE/i);
      });
    });

    // when string null is passed
    it("return 400 when string null is passed", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=null"
      );
      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/null/i);
      });
    });

    // when string undefined is passed 
    it("return 400 when string undefined is passed", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=undefined"
      );
      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/undefined/i);
      });
    });

    // pi is number
    it("return 400 when a number is passed", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=1222"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // pi is float
    it("return 400 when a float is passed", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=-1222.22"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // pi is case-incensive 1
    it("return 200 when case-insensitive icse", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=icse"
      );

      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/ICSE/i);
      });
    });

    // pi is case-incensive 2
    it("return 200 when case-insensitive i", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=i"
      );
      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/I/i);
      });
    });

    // pi is case-incensitive 3
    it("return 200 when case-insensitive {space}N", async () => {
      const res = await request(app).get(
        "/api/papers?published_in= N"
      );

      expect(res.status).toBe(200);
      res.body.forEach((paper) => {
        expect(paper.published_in).toMatch(/ n/i);
      });
    });

    // pi is case-incenstive 4 only space
    it("return 400 when case-insensitive {space}", async () => {
      const res = await request(app).get(
        "/api/papers?published_in=%20%20%20"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });


    // limit is 3
    it("return 200 when limit is 3", async () => {
      const res = await request(app).get("/api/papers?limit=3");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeLessThanOrEqual(3);
    });

    // limit is > 100 (101)
    it("return 400 when limit is 101, bigger than 100", async () => {
      const res = await request(app).get("/api/papers?limit=101");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    
    // limit is negative
    it("return 400 when limit is -3", async () => {
      const res = await request(app).get("/api/papers?limit=-4");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // limit is float
    it("return 400 when limit is float", async () => {
      const res = await request(app).get("/api/papers?limit=1.13");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // limit is empty
    it("return 400 when limit= , so default 10 is used", async () => {
      const res = await request(app).get("/api/papers?limit=");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // limit is string
    it("return 400 when limit is string", async () => {
      const res = await request(app).get("/api/papers?limit=tired");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // limit is string null
    it("return 400 when limit is string null", async () => {
      const res = await request(app).get("/api/papers?limit=null");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // limit is string undefined
    it("return 400 when limit is string undefined", async () => {
      const res = await request(app).get("/api/papers?limit=undefined");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });


    // offset is 3
    it("return 200 when offset is 3", async () => {
      const res = await request(app).get("/api/papers?offset=3");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // offset is negative
    it("return 400 when offset is negative", async () => {
      const res = await request(app).get("/api/papers?offset=-12");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // offset is float
    it("return 400 when offset is float", async () => {
      const res = await request(app).get("/api/papers?offset=12.4");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // offset is empty
    it("return 200 when offset is empty default 0", async () => {
      const res = await request(app).get("/api/papers?offset=");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // offset is string
    it("return 400 when offset is string", async () => {
      const res = await request(app).get("/api/papers?offset=tired");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // offset is string null
    it("return 400 when offset is string null", async () => {
      const res = await request(app).get("/api/papers?offset=null");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });

    // offset is string undefined
    it("return 400 when offset is string undefined", async () => {
      const res = await request(app).get("/api/papers?offset=undefined");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toEqual("Invalid query parameter format");
    });
  });


  // GET /api/papers/:id
  describe("GET /api/papers/:id", () => {
    // retrieve an id and find it
    it("should retrieve a paper by ID", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(samplePaper);
      const res = await request(app).get(`/api/papers/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(createRes.body);
    });

    // 404 error
    it("should return 404 if paper is not found", async () => {
      const res = await request(app).get("/api/papers/99999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });

    // id is null
    it("should return 400 if id is null ", async () => {
      const res = await request(app).get("/api/papers/null");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    // id is undefineds
    it("should return 400 if id is undefined ", async () => {
      const res = await request(app).get("/api/papers/null");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    // id is float
    it("should return 400 if id is float ", async () => {
      const res = await request(app).get("/api/papers/3.5");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    // id is negative
    it("should return 400 if id is negative", async () => {
      const res = await request(app).get("/api/papers/-14");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });
  });


  // PUT /api/papers/:id
  describe("PUT /api/papers/:id", () => {

    // update an existing paper
    it("should update an existing paper", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(samplePaper);
      const updatedPaper = {
        title: "Updated Title",
        authors: "Updated Author",
        published_in: "Updated Venue",
        year: 2025,
      };
      const res = await request(app)
        .put(`/api/papers/${createRes.body.id}`)
        .send(updatedPaper);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(updatedPaper);
      expect(res.body).toHaveProperty("updated_at");
    });

    // paper is not found
    it("should return 404 if paper is not found", async () => {
      const res = await request(app).put("/api/papers/99999").send(samplePaper);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });

    // id is negative
    it("should return 400 if paper is negative", async () => {
      const res = await request(app).put("/api/papers/-12").send(samplePaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });


    // string null is passed
    it("should return 400 if paper is string null", async () => {
      const res = await request(app).put("/api/papers/null").send(samplePaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    // string undefined 
    it("should return 400 if paper is string undefined", async () => {
      const res = await request(app).put("/api/papers/undefined").send(samplePaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    // missing title and wrong year
    it("return 400 for missing title and wrong year", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(whiteTrailPaper);
      const updatedPaper = {
        title: "",
        authors: "Updated Author",
        published_in: "Updated Venue",
        year: 120,
      };
      const res = await request(app)
        .put(`/api/papers/${createRes.body.id}`)
        .send(updatedPaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Valid year after 1900 is required"
      ]);
    });

    it("return 400 for null title, numbered authors and missing year", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(whiteTrailPaper);
      const updatedPaper = {
        title: null,
        authors: 1313141,
        published_in: "Updated Venue"
      };
      const res = await request(app)
        .put(`/api/papers/${createRes.body.id}`)
        .send(updatedPaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required",
        "Published year is required"
      ]);
    });

    it("return 400 for all bad fields ", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(whiteTrailPaper);
      const updatedPaper = {
        title: undefined,
        authors: "         ",
        published_in: "",
        year: "2000"
      };
      const res = await request(app)
        .put(`/api/papers/${createRes.body.id}`)
        .send(updatedPaper);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual([
        "Title is required",
        "Authors are required", 
        "Published venue is required", 
        "Published year is required"
      ]);
    });

    it("should update an existing paper 2", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(whiteTrailPaper);
      const updatedPaper = {
        title: "Updated Title 2",
        authors: "Updated Author 2",
        published_in: "Updated Venue",
        year: 2025,
        notes: "eqeqeqeq"
      };

      const updatedPaperRet = {
        title: "Updated Title 2",
        authors: "Updated Author 2",
        published_in: "Updated Venue",
        year: 2025,
      };

      const res = await request(app)
        .put(`/api/papers/${createRes.body.id}`)
        .send(updatedPaper);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(updatedPaperRet);
      expect(res.body).toHaveProperty("updated_at");
    });
  });

  // DELETE /api/papers/:id
  describe("DELETE /api/papers/:id", () => {
    // delete a paper
    it("should delete a paper by ID", async () => {
      const createRes = await request(app)
        .post("/api/papers")
        .send(samplePaper);
      const res = await request(app).delete(`/api/papers/${createRes.body.id}`);

      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/papers/${createRes.body.id}`);
      expect(getRes.status).toBe(404);
    });

    // paper is not found
    it("should return 404 if paper is not found", async () => {
      const res = await request(app).delete("/api/papers/99999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });

    // paper id is negative
    it("should return 400 if paper is negative", async () => {
      const res = await request(app).delete("/api/papers/-1");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 if paper is negative", async () => {
      const res = await request(app).delete("/api/papers/-1");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 if paper is float", async () => {
      const res = await request(app).delete("/api/papers/3.34555");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 if paper is string null", async () => {
      const res = await request(app).delete("/api/papers/null");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 if paper is string undefined", async () => {
      const res = await request(app).delete("/api/papers/undefined");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("should return 400 if paper is string", async () => {
      const res = await request(app).delete("/api/papers/djalkd");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });
  });
});