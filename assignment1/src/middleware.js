// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Validate paper input
const validatePaper = (paper) => {
  // TODO: Implement paper validation  
  const errors = [];

  // Validate title
  if (!paper.title || typeof paper.title !== "string" || paper.title.trim() === "") {
    errors.push("Title is required");
  }

  // Validate authors
  if (!paper.authors || typeof paper.authors !== "string" || paper.authors.trim() === "") {
    errors.push("Authors are required");
  }

  // Validate published_in
  if (!paper.published_in || typeof paper.published_in !== "string" || paper.published_in.trim() === "") {
    errors.push("Published venue is required");
  }

  // Validate year 
  if (paper.year == undefined) {
    errors.push("Published year is required");
  } else {
    const yearInt = parseInt(paper.year, 10);
    if (isNaN(yearInt) || yearInt <= 1900) {
      errors.push("Valid year after 1900 is required");
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

  // Invalid Query Parameter (400 Bad Request)
  if (err.type === "Invalid Query Parameter") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
    });
  }

  // Not Found Error (404 Not Found)
  if (err.type === "Not Found") {
    return res.status(404).json({
      error: "Paper not found",
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
    const validationError = new Error("Invalid ID format");
    validationError.type = "Validation Error";
    next(validationError);
    return;
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
