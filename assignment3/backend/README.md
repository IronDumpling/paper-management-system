# Academic Paper Management System

A RESTful API for managing academic papers and authors using Express.js and PostgreSQL.

## Features

- CRUD operations for papers & authors
- Many-to-many paper-author relationships
- Advanced filtering & pagination
- Input validation & error handling
- Constraint-based deletion rules

## Technologies

- Node.js/Express.js
- PostgreSQL
- Prisma ORM
- REST API standards

## Database Setup

1. Create PostgreSQL database:
```bash
createdb paper_management
```

2. Configure Prisma schema (`prisma/schema.prisma`):
```prisma
model Paper {
  id          Int      @id @default(autoincrement())
  title       String
  publishedIn String
  year        Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  authors     Author[] @relation("PaperToAuthor")
}

model Author {
  id          Int      @id @default(autoincrement())
  name        String
  email       String?
  affiliation String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  papers      Paper[]  @relation("PaperToAuthor")
}
```

3. Run migrations:
```bash
npx prisma migrate dev
```

## API Endpoints

### Papers

| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| GET    | /api/papers      | List papers with filters & pagination|
| GET    | /api/papers/:id  | Get paper details                    |
| POST   | /api/papers      | Create new paper                     |
| PUT    | /api/papers/:id  | Update paper                         |
| DELETE | /api/papers/:id  | Delete paper                         |

**Example Paper Creation:**
```json
POST /api/papers
{
  "title": "Advanced AI Research",
  "publishedIn": "NeurIPS 2024",
  "year": 2024,
  "authors": [
    {
      "name": "Alice Chen",
      "email": "alice@mit.edu",
      "affiliation": "MIT"
    }
  ]
}
```

### Authors

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | /api/authors      | List authors with filters            |
| GET    | /api/authors/:id  | Get author details                   |
| POST   | /api/authors      | Create new author                    |
| PUT    | /api/authors/:id  | Update author                        |
| DELETE | /api/authors/:id  | Delete author                        |

**Example Author Response:**
```json
GET /api/authors/1
{
  "id": 1,
  "name": "John Doe",
  "email": "john@utoronto.ca",
  "affiliation": "University of Toronto",
  "papers": [
    {
      "id": 1,
      "title": "Quantum Computing Advances",
      "year": 2023,
      "publishedIn": "Science Journal"
    }
  ]
}
```

## Validation Rules

### Papers
- Title: Required non-empty string
- Year: > 1900
- Authors: Minimum 1 author with valid name

### Authors
- Name: Required non-empty string
- Email: Optional string format
- Affiliation: Optional string

## Error Handling

**Common Error Responses:**
```json
400 Bad Request (Validation):
{
  "error": "Validation Error",
  "messages": ["Year must be greater than 1900"]
}

404 Not Found:
{
  "error": "Paper not found"
}

400 Constraint Error:
{
  "error": "Constraint Error",
  "message": "Cannot delete author: sole author of papers"
}
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment (.env):
```ini
DATABASE_URL="postgresql://user:password@localhost:5432/paper_management"
```

3. Start server:
```bash
npm start
```
