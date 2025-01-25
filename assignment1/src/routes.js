const express = require("express");
const router = express.Router();
const db = require("./database");
const { validatePaper, requestLogger, errorHandler, validateId } = require("./middleware");

router.use(requestLogger);

// GET /api/papers
router.get("/papers", validateFilters, async (req, res, next) => {
  try {
    const filters = {
      year: req.query.year ? parseInt(req.query.year) : null,
      published_in: req.query.published_in,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    };

    // Your implementation here
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
    if (!paper) {
      const notFoundError = new Error("Paper not found");
      notFoundError.type = "Not Found";
      throw notFoundError;
    }
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
      return res
        .status(400)
        .json({ error: "Validation Error", messages: errors });
    }

    // Your implementation here
    const createdPaper = await db.createPaper(req.body);
    res.status(201).json(createdPaper);
  } catch (error) {
    next(error);
  }
});

// PUT /api/papers/:id
router.put("/papers/:id", async (req, res, next) => {
  try {
    const errors = validatePaper(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation Error", messages: errors });
    }

    // Your implementation here
    const updatedPaper = await db.updatePaper(id, req.body);

    if (!updatedPaper) {
      return res.status(404).json({ error: "Paper not found" });
    }

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
