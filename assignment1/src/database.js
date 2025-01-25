const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./paper_management.db", (err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// TODO: Create a table named papers with the schema specified in the handout
db.run(`
  CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    published_in TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year > 1900),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating 'papers' table:", err);
  } else {
    console.log("Successfully created or verified 'papers' table");
  }
});

// TODO: Implement these database operations
const dbOperations = {
  createPaper: async (paper) => {
    // Your implementation here
    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO papers (title, authors, published_in, year) VALUES (?, ?, ?, ?)`,
          [paper.title, paper.authors, paper.published_in, paper.year],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID); 
            }
          }
        );
      });

      const createdPaper = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM papers WHERE id = ?`,
          [result],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
  
      return createdPaper;
    } catch (error) {
      throw error; 
    }
  },

  getAllPapers: async (filters = {}) => {
    // Your implementation here
    try {
      let query = "SELECT * FROM papers";
      const params = [];
      const conditions = [];

      // Apply filters
      if (filters.year) {
        conditions.push("year = ?");
        params.push(filters.year);
      }

      if (filters.published_in) {
        conditions.push("LOWER(published_in) LIKE ?");
        params.push(`%${filters.published_in.toLowerCase()}%`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      // Add pagination
      query += " LIMIT ? OFFSET ?";
      params.push(filters.limit, filters.offset);

      const result = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows); // Return the rows matching the filters and pagination
          }
        });
      });

      return result;
    } catch (error) {
      throw error; 
    }
  },

  getPaperById: async (id) => {
    // Your implementation here
    // Hint: Use await with a new Promise that wraps the db.get() operation
    try {
      const result = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM papers WHERE id = ?`, [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row); 
          }
        });
      });

      if (!result) {
        throw new Error(`Paper not found`);
      }

      return result;
    } catch (error) {
      throw error; 
    }
  },

  updatePaper: async (id, paper) => {
    // Your implementation here
    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `
          UPDATE papers
          SET title = ?, authors = ?, published_in = ?, year = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
          [paper.title, paper.authors, paper.published_in, paper.year, id],
          function (err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error("Paper not found or no changes made."));
            } else {
              resolve(this.changes); // Return the number of rows updated
            }
          }
        );
      });

      // Fetch the updated paper
      const updatedPaper = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM papers WHERE id = ?`,
          [id],
          (err, row) => {
            if (err) reject(err);
            else if (!row) reject(new Error("Paper not found"));
            else resolve(row);
          }
        );
      });

      return updatedPaper;
    } catch (error) {
      throw error; 
    }
  },

  deletePaper: async (id) => {
    // Your implementation here
    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `DELETE FROM papers WHERE id = ?`, [id], 
          function (err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error(`Paper with ID ${id} not found`));
            } else {
              resolve(this.changes); // Return the number of rows deleted
            }
          }
        );
      });

      return { message: `Paper with ID ${id} deleted successfully` };
    } catch (error) {
      throw error; 
    }
  },
};

module.exports = {
  db, // export the database instance
  ...dbOperations, // spreads all operations as individual exports
};
