const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// TODO: Implement these database operations
const dbOperations = {
  createPaper: async (paperData) => {
    try {
      return await prisma.paper.create({
        data: {
          title: paperData.title,
          publishedIn: paperData.publishedIn,
          year: paperData.year,
          authors: {
            connectOrCreate: paperData.authors.map(author => ({
              where: {
                name_email_affiliation: {
                  name: author.name,
                  email: author.email || null,
                  affiliation: author.affiliation || null
                }
              },
              create: author
            }))
          }
        },
        include: { authors: true }
      });
    } catch (error) {
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
        where.authors = {
          every: {
            name: {
              contains: filters.authors,
              mode: 'insensitive'
            }
          }
        };
      }

      const [papers, total] = await Promise.all([
        prisma.paper.findMany({
          where,
          take: filters.limit,
          skip: filters.offset,
          include: { authors: true },
          orderBy: { createdAt: 'desc' }
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
        // Clear existing authors
        await tx.paper.update({
          where: { id },
          data: { authors: { set: [] } }
        });

        // Reconnect with new/existing authors
        return tx.paper.update({
          where: { id },
          data: {
            title: paperData.title,
            publishedIn: paperData.publishedIn,
            year: paperData.year,
            authors: {
              connectOrCreate: paperData.authors.map(author => ({
                where: {
                  name_email_affiliation: {
                    name: author.name,
                    email: author.email || null,
                    affiliation: author.affiliation || null
                  }
                },
                create: author
              }))
            }
          },
          include: { authors: true }
        });
      });
    } catch (error) {
      if (error.code === 'P2025') return null; // Not found
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
        paper.authors.length === 1 && 
        paper.authors.some(a => a.id === id)
      );

      if (soleAuthorPapers.length > 0) {
        return { error: "CONSTRAINT" };
      }

      // Delete author and their relationships
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
