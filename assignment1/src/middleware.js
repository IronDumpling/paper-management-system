// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Validate paper input
const validatePaper = (paper) => {
  // TODO: Implement paper validation  
  const errors = [];
  const { year, limit, offset, published_in } = req.query;

  // Validate year 
  if (year) {
    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt) || yearInt <= 1900) {
      errors.push("Valid year after 1900 is required");
    }
  }

  // Validate title
  if (!paper.title || typeof paper.title !== "string" || paper.title.trim() === "") {
    errors.push("Title is required");
  }

  // Validate authors
  if (!paper.authors || typeof paper.authors !== "string" || paper.authors.trim() === "") {
    errors.push("Authors are required");
  }

  // Validate published_in
  if (!published_in || typeof paper.published_in !== "string" || paper.published_in.trim() === "") {
    errors.push("Published venue is required");
  }

  // Validate limit
  if (limit) {
    const limitInt = parseInt(limit, 10);
    if (isNaN(limitInt) || limitInt <= 0 || limitInt > 100) {
      errors.push("Limit must be a positive integer no greater than 100.");
    }
  }

  // Validate offset
  if (offset) {
    const offsetInt = parseInt(offset, 10);
    if (isNaN(offsetInt) || offsetInt < 0) {
      errors.push("Offset must be a non-negative integer.");
    }
  }

  return errors;
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // TODO: Implement error handling
  console.error(err); 

  // Validation Errors (400 Bad Request)
  if (err.type === "Validation Error") {
    return res.status(400).json({
      error: "Validation Error",
      messages: err.messages || ["Invalid request"],
    });
  }

  // Not Found Error (404 Not Found)
  if (err.type === "Not Found") {
    return res.status(404).json({
      error: "Paper not found",
    });
  }

  // Invalid Query Parameter (400 Bad Request)
  if (err.type === "Invalid Query Parameter") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
    });
  }

  // Default: Internal Server Error (500)
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });

  next();
};

// Validate ID parameter middleware
const validateId = (req, res, next) => {
  // TODO: Implement ID validation
  const { id } = req.params;

  // Check if the ID is a positive integer
  const idInt = parseInt(id, 10);
  if (isNaN(idInt) || idInt <= 0) {
    // return res.status(400).json({
    //   error: "Validation Error",
    //   message: "Invalid ID format",
    // });
    const validationError = new Error("Invalid ID format");
    validationError.type = "Validation Error";
    throw validationError;
  }

  req.id = idInt;
  next();
};

module.exports = {
  requestLogger,
  validatePaper,
  errorHandler,
  validateId,
};
