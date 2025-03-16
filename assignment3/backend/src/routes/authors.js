const express = require("express");
const router = express.Router();
const db = require("../database");
const middleware = require("../middleware");

// GET /api/authors
router.get("/", middleware.validateAuthorQueryParams, async (req, res, next) => {
  try {
    // Destructure the filters from the query
    const { name, affiliation, limit, offset } = req.query;
    // Pass filters to db.getAllAuthors so that the database layer can build the 'where' clause
    const { authors, total } = await db.getAllAuthors({
      name,
      affiliation,
      limit,
      offset,
    });
    res.json({
      authors,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/authors/:id
router.get("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const author = await db.getAuthorById(req.resourceId);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    res.json(author);
  } catch (error) {
    next(error);
  }
});

// POST /api/authors
router.post("/", async (req, res, next) => {
  try {
    const errors = middleware.validateAuthorInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        messages: errors,
      });
    }

    const author = await db.createAuthor(req.body);
    res.status(201).json(author);
  } catch (error) {
    next(error);
  }
});

// PUT /api/authors/:id
router.put("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const errors = middleware.validateAuthorInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation Error",
        messages: errors,
      });
    }

    const author = await db.updateAuthor(req.resourceId, req.body);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    res.json(author);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/authors/:id
router.delete("/:id", middleware.validateResourceId, async (req, res, next) => {
  try {
    const result = await db.deleteAuthor(req.resourceId);

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Author not found" });
    }

    if (result.error === "CONSTRAINT") {
      return res.status(400).json({
        error: "Constraint Error",
        message: "Cannot delete author: they are the only author of one or more papers",
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
