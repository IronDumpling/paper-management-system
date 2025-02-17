const express = require("express");
const router = express.Router();
const db = require("../database");
const middleware = require("../middleware");

// GET /api/authors
router.get(
  "/",
  middleware.validateAuthorQueryParams,
  async (req, res, next) => {
    try {
      const { name, affiliation } = req.query;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      // Build filter conditions
      const where = {};
      if (name) where.name = { contains: name, mode: "insensitive" };
      if (affiliation) where.affiliation = { contains: affiliation, mode: "insensitive" };

      const [authors, total] = await Promise.all([
        db.getAllAuthors({
          where,
          limit,
          offset,
        }),
        db.countAuthors(where),
      ]);

      res.json({
        authors,
        total,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
    const papers = await db.getAuthorPapers(req.resourceId);
    const soleAuthorPapers = papers.filter(p => p.authors.length === 1);

    if (soleAuthorPapers.length > 0) {
      return res.status(400).json({
        error: "Constraint Error",
        message: "Cannot delete author: they are the only author of one or more papers",
      });
    }

    const deleted = await db.deleteAuthor(req.resourceId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Author not found" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
