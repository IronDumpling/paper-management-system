const express = require("express");
const router = express.Router();
const db = require("./database");
const { validatePaper, requestLogger, errorHandler, validateId } = require("./middleware");

// GET /api/papers
router.get("/papers", async (req, res, next) => {
  try {
    // Validate limit parameter
    if (req.query.limit && !/^\d+$/.test(req.query.limit)) {
      const error = new Error("Invalid limit parameter");
      error.type = "Invalid Query Parameter";
      throw error;
    }

    // Validate offset parameter
    if (req.query.offset && !/^\d+$/.test(req.query.offset)) {
      const error = new Error("Invalid offset parameter");
      error.type = "Invalid Query Parameter";
      throw error;
    }

    // Validate year parameter
    if (req.query.year !== undefined && req.query.year !== "") {
      const year = Number(req.query.year);

      // Check if year is a valid integer and greater than 1900
      if (!Number.isInteger(year) || year <= 1900) {
        const error = new Error("Invalid year parameter");
        error.type = "Invalid Query Parameter";
        throw error;
      }
    }

    if (req.query.published_in !== undefined && req.query.published_in !== "") {
      const publishedInTrimmed = req.query.published_in.trim();
      if (publishedInTrimmed === "" || !isNaN(Number(publishedInTrimmed))) {
        const error = new Error("Invalid published_in parameter");
        error.type = "Invalid Query Parameter";
        throw error;
      }
    }
    
    const filters = {
      year: req.query.year ? parseInt(req.query.year) : null,
      published_in: req.query.published_in,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    };

    // Your implementation here
    
    // Validate limit parameter
    if (isNaN(filters.limit) || filters.limit <= 0 || filters.limit > 100) {
      const error = new Error("Invalid limit parameter");
      error.type = "Invalid Query Parameter";
      throw error;
    }

    // Validate offset parameter
    if (isNaN(filters.offset) || filters.offset < 0) {
      const error = new Error("Invalid offset parameter");
      error.type = "Invalid Query Parameter";
      throw error;
    }
    
    const papers = await db.getAllPapers(filters);
    res.status(200).json(papers);
  } catch (error) {
    next(error);
  }
});

// GET /api/papers/:id
router.get("/papers/:id", validateId, async (req, res, next) => {
  try {
    const id = req.id;
    const paper = await db.getPaperById(id);
    res.status(200).json(paper);
  } catch (error) {
    next(error);
  }
});

// POST /api/papers
router.post("/papers", async (req, res, next) => {
  try {
    const errors = validatePaper(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: "Validation Error", 
        messages: errors 
      });
    }

    // Your implementation here
    const createdPaper = await db.createPaper(req.body);
    res.status(201).json(createdPaper);
  } catch (error) {
    next(error);
  }
});

// PUT /api/papers/:id
router.put("/papers/:id", validateId, async (req, res, next) => {
  try {
    const errors = validatePaper(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: "Validation Error", 
        messages: errors 
      });
    }

    // Your implementation here
    const updatedPaper = await db.updatePaper(req.id, req.body);
    res.status(200).json(updatedPaper);

  } catch (error) {
    next(error);
  }
});

// DELETE /api/papers/:id
router.delete("/papers/:id", validateId, async (req, res, next) => {
  try {
    // Your implementation here
    const id = parseInt(req.params.id, 10);
    await db.deletePaper(id);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Paper not found" });
    }
    next(error);
  }
});

module.exports = router;
