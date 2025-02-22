// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Validate paper input for Assignment 2
// Note: This is different from Assignment 1 as it handles authors as objects
const validatePaperInput = (paper) => {
  const errors = [];
  
  if (!paper.title || typeof paper.title !== 'string' || paper.title.trim() === '') {
    errors.push("Title is required");
  }
  
  if (!paper.publishedIn || typeof paper.publishedIn !== 'string' || paper.publishedIn.trim() === '') {
    errors.push("Published venue is required");
  }
  
  if (typeof paper.year === 'undefined') {
    errors.push("Published year is required");
  } else if (!Number.isInteger(paper.year) || paper.year <= 1900) {
    errors.push("Valid year after 1900 is required");
  }
  
  if (!Array.isArray(paper.authors) || paper.authors.length === 0) {
    errors.push("At least one author is required");
  } else {
    const hasInvalidAuthor = paper.authors.some(author => 
      !author.name || typeof author.name !== 'string' || author.name.trim() === ''
    );
    
    if (hasInvalidAuthor) {
      errors.push("Author name is required");
    }
  }
  
  return errors;
};

// Validate author input
const validateAuthorInput = (author) => {
  const errors = [];
  
  if (!author.name || typeof author.name !== 'string' || author.name.trim() === '') {
    errors.push("Name is required");
  }
  
  return errors;
};

// Validate query parameters for papers
const validatePaperQueryParams = (req, res, next) => {
  const errors = [];
  const { year, publishedIn, author, limit, offset } = req.query;

  // Validate year
  if (year) {
    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt)) {
      errors.push("Year must be a valid integer");
    } else if (yearInt <= 1900) {
      errors.push("Year must be greater than 1900");
    } else {
      req.query.year = yearInt;
    }
  }

  // Validate publishedIn
  if (publishedIn && typeof publishedIn === 'string' && publishedIn.trim() === '') {
    errors.push("Invalid publishedIn parameter");
  }

  // Validate author(s)
  if (author) {
    const authors = [].concat(author).filter(a => a !== undefined);
    if (authors.some(a => typeof a !== 'string' || a.trim() === '')) {
      errors.push("Invalid author parameter");
    }
  }

  // Validate limit
  if (limit) {
    req.query.limit = parseInt(limit, 10);
    if (isNaN(req.query.limit)) {
      errors.push("Limit must be a valid integer");
    } else if (req.query.limit <= 0 || req.query.limit > 100) {
      errors.push("Limit must be between 1 and 100");
    }
  } else {
    req.query.limit = 10;
  }

  // Validate offset
  if (offset) {
    req.query.offset = parseInt(offset, 10);
    if (isNaN(req.query.offset)) {
      errors.push("Offset must be a valid integer");
    } else if (req.query.offset < 0) {
      errors.push("Offset cannot be negative");
    }
  } else {
    req.query.offset = 0;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
      details: errors
    });
  }
  
  next();
};

// Validate query parameters for authors
const validateAuthorQueryParams = (req, res, next) => {
  const errors = [];
  const { limit, offset } = req.query;

  // Validate limit
  if (limit) {
    req.query.limit = parseInt(limit, 10);
    if (isNaN(req.query.limit)) {
      errors.push("Limit must be a valid integer");
    } else if (req.query.limit <= 0 || req.query.limit > 100) {
      errors.push("Limit must be between 1 and 100");
    }
  } else {
    req.query.limit = 10;
  }

  // Validate offset
  if (offset) {
    req.query.offset = parseInt(offset, 10);
    if (isNaN(req.query.offset)) {
      errors.push("Offset must be a valid integer");
    } else if (req.query.offset < 0) {
      errors.push("Offset cannot be negative");
    }
  } else {
    req.query.offset = 0;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
      details: errors
    });
  }

  next();
};

// Validate resource ID parameter
// Used for both paper and author endpoints
const validateResourceId = (req, res, next) => {
  const { id } = req.params;
  const idInt = parseInt(id, 10);
  
  if (isNaN(idInt)) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid ID format"
    });
  }
  
  if (idInt <= 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "ID must be a positive integer"
    });
  }
  
  req.resourceId = idInt;
  next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.type === 'Validation Error') {
    return res.status(400).json({
      error: "Validation Error",
      messages: err.messages || ["Validation failed"]
    });
  }

  // Handle Prisma known errors
  if (err.code === 'P2025') {
    return res.status(404).json({ error: "Resource not found" });
  }

  if (err.type === 'Not Found') {
    return res.status(404).json({
      error: "Resource not found"
    });
  }

  if (err.code === 'CONSTRAINT') {
    return res.status(400).json({
      error: "Constraint Error",
      message: err.message
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  });
};

module.exports = {
  requestLogger,
  validatePaperInput,
  validateAuthorInput,
  validatePaperQueryParams,
  validateAuthorQueryParams,
  validateResourceId,
  errorHandler,
};
