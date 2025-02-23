const express = require("express");
const router = express.Router();
const db = require("../database");
const middleware = require("../middleware");

// GET /api/papers
router.get("/", middleware.validatePaperQueryParams, async (req, res, next) => {
  try {
    const { year, publishedIn, author, limit = 10, offset = 0 } = req.query;
    
    // Convert author to array if multiple values provided
    const authors = [].concat(author || []).filter(a => a);
    
    // console.log(req.query);

    const filters = {
      year: year ? parseInt(year) : undefined,
      publishedIn,
      authors,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const { papers, total } = await db.getAllPapers(filters);
    
    res.json({
      papers,
      total,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/papers/:id
router.get("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const paper = await db.getPaperById(req.resourceId);
    
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    res.json(paper);
  } catch (error) {
    next(error);
  }
});

// POST /api/papers
router.post("/", async (req, res, next) => {
  try {
    const errors = middleware.validatePaperInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        messages: errors
      });
    }

    const paper = await db.createPaper(req.body);
    res.status(201).json(paper);
  } catch (error) {
    next(error);
  }
});

// PUT /api/papers/:id
router.put("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const errors = middleware.validatePaperInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        messages: errors
      });
    }

    const paper = await db.updatePaper(req.resourceId, req.body);
    
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    res.json(paper);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/papers/:id
router.delete("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const deleted = await db.deletePaper(req.resourceId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Paper not found" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
