const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// TODO: Implement these database operations
const dbOperations = {
  createPaper: async (paperData) => {
    try {
      const processedAuthors = await Promise.all(
        paperData.authors.map(async (author) => {
          // 1. Find existing authors with exact matches
          const existingAuthors = await prisma.author.findMany({
            where: {
              name: author.name,
              email: author.email === undefined ? null : author.email,
              affiliation: author.affiliation === undefined ? null : author.affiliation
            },
            orderBy: { id: "asc" } 
          });

          // 2. Return the first match or new author data
          return existingAuthors.length > 0 ? existingAuthors[0] : author;
        })
      );

      // 3. Create paper with explicit connections
      return await prisma.paper.create({
        data: {
          title: paperData.title,
          publishedIn: paperData.publishedIn,
          year: paperData.year,
          authors: {
            connect: processedAuthors.filter(a => a.id).map(a => ({ id: a.id })),
            create: processedAuthors.filter(a => !a.id).map(a => ({
              name: a.name,
              email: a.email,
              affiliation: a.affiliation
            }))
          }
        },
        include: { authors: true }
      });
    } catch (error) {
      // Handle unique constraint errors generically
      if (error.code === "P2002") {
        error.type = "Validation Error";
        error.messages = ["Duplicate paper detected"];
      }
      throw error;
    }
  },

  getAllPapers: async (filters = {}) => {
    try {
      const where = {};
      
      // Year filter
      if (filters.year) where.year = filters.year;
      
      // PublishedIn partial match
      if (filters.publishedIn) {
        where.publishedIn = { 
          contains: filters.publishedIn,
          mode: 'insensitive'
        };
      }
      
      // Author partial matches (AND logic)
      if (filters.authors && filters.authors.length > 0) {
        // For each provided author filter, require that at least one author matches
        where.AND = filters.authors.map(authorFilter => ({
          authors: {
            some: {
              name: {
                contains: authorFilter,
                mode: 'insensitive'
              }
            }
          }
        }));
      }

      const [papers, total] = await Promise.all([
        prisma.paper.findMany({
          where,
          take: filters.limit,
          skip: filters.offset,
          include: { authors: { orderBy: { id: 'asc' } } },
          orderBy: { id: 'asc' }
        }),
        prisma.paper.count({ where })
      ]);

      return { 
        papers, 
        total,
        limit: filters.limit,
        offset: filters.offset
      };
    } catch (error) {
      throw error;
    }
  },

  getPaperById: async (id) => {
    try {
      return await prisma.paper.findUnique({
        where: { id },
        include: { authors: true }
      });
    } catch (error) {
      throw error;
    }
  },

  updatePaper: async (id, paperData) => {
    try {
      return await prisma.$transaction(async (tx) => {
        // Disconnect all existing authors for this paper
        await tx.paper.update({
          where: { id },
          data: { authors: { set: [] } }
        });
  
        // Prepare arrays for authors to connect and create
        const connectArray = [];
        const createArray = [];
  
        // For each author in the update data, check if an exact match exists
        for (const author of paperData.authors) {
          const existingAuthor = await tx.author.findFirst({
            where: {
              name: author.name,
              email: author.email || null,
              affiliation: author.affiliation || null
            }
          });
          if (existingAuthor) {
            connectArray.push({ id: existingAuthor.id });
          } else {
            createArray.push(author);
          }
        }
  
        // Update the paper with new details and the new authors list
        return tx.paper.update({
          where: { id },
          data: {
            title: paperData.title,
            publishedIn: paperData.publishedIn,
            year: paperData.year,
            authors: {
              // Reconnect with authors that already exist
              connect: connectArray,
              // Create new authors if no exact match was found
              create: createArray
            }
          },
          include: { authors: true }
        });
      });
    } catch (error) {
      // If the paper is not found, return null
      if (error.code === 'P2025') return null;
      throw error;
    }
  },

  deletePaper: async (id) => {
    try {
      return await prisma.paper.delete({
        where: { id }
      });
    } catch (error) {
      if (error.code === 'P2025') return null; // Not found
      throw error;
    }
  },

  // Author Operations
  createAuthor: async (authorData) => {
    try {
      return await prisma.author.create({
        data: {
          name: authorData.name,
          email: authorData.email,
          affiliation: authorData.affiliation
        },
        include: { 
          papers: true // Include empty papers array in response
        }
      });
    } catch (error) {
      // Handle unique constraint violations if needed
      if (error.code === 'P2002') {
        const constraintError = new Error('Author already exists');
        constraintError.code = 'CONFLICT';
        throw constraintError;
      }
      throw error;
    }
  },

  getAllAuthors: async (filters = {}) => {
    try {
      const { name, affiliation, limit = 10, offset = 0 } = filters;
      const where = {};
      
      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }
      if (affiliation) {
        where.affiliation = { contains: affiliation, mode: 'insensitive' };
      }

      const [authors, total] = await Promise.all([
        prisma.author.findMany({
          where,
          take: limit,
          skip: offset,
          include: { papers: true },
        }),
        prisma.author.count({ where }),
      ]);

      return { authors, total, limit, offset };
    } catch (error) {
      throw error;
    }
  },

  getAuthorById: async (id) => {
    try {
      return await prisma.author.findUnique({
        where: { id },
        include: { papers: true },
      });
    } catch (error) {
      throw error;
    }
  },

  updateAuthor: async (id, authorData) => {
    try {
      return await prisma.author.update({
        where: { id },
        data: {
          name: authorData.name,
          email: authorData.email,
          affiliation: authorData.affiliation,
        },
        include: { papers: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return null; // Not found
      }
      throw error;
    }
  },

  deleteAuthor: async (id) => {
    try {
      // Check if author exists
      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) {
        return { error: "NOT_FOUND" };
      }
  
      // Check constraint: author is sole author of any papers
      const papers = await prisma.paper.findMany({
        where: { authors: { some: { id } } },
        include: { authors: true },
      });
  
      const soleAuthorPapers = papers.filter(paper =>
        paper.authors.length === 1 && paper.authors.some(a => a.id === id)
      );
  
      if (soleAuthorPapers.length > 0) {
        return { error: "CONSTRAINT" };
      }
  
      // Delete the author
      await prisma.author.delete({
        where: { id },
      });
  
      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        return { error: "NOT_FOUND" };
      }
      throw error;
    }
  },
};

module.exports = {
  ...dbOperations,
};
