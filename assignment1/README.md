# Paper Management System API

A simple RESTful API for managing academic papers, built with Express.js and SQLite.

## Features

- CRUD operations for academic papers
- Input validation and error handling
- Filtering and pagination for paper listings
- Automatic timestamp management
- SQLite database integration

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git (optional)

## Installation

1. **Clone the repository**
   ```bash
   https://github.com/IronDumpling/paper-management-system.git
   cd paper-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database setup**
   ```bash
   # The database (paper_management.db) will be automatically created
   # on first run. No additional setup required.
   ```

## Configuration

- **Database**: SQLite database file at `./paper_management.db`
- **Port**: Defaults to 3000 (can be changed via environment variables)
- **Reset Database**: Delete `paper_management.db` to start fresh

## Running the Server

```bash
npm start
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Papers Collection

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | /api/papers       | List all papers with filtering  |
| POST   | /api/papers       | Create new paper                |

### Individual Paper

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/papers/:id   | Get paper by ID      |
| PUT    | /api/papers/:id   | Update paper by ID   |
| DELETE | /api/papers/:id   | Delete paper by ID   |

## Example Requests

**Create Paper**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "title": "Example Paper",
    "authors": "John Doe, Jane Smith",
    "published_in": "ICSE 2024",
    "year": 2024
  }' \
  http://localhost:3000/api/papers
```

**Get Paper by ID**
```bash
curl http://localhost:3000/api/papers/1
```

**Filter Papers**
```bash
curl "http://localhost:3000/api/papers?year=2024&published_in=ICSE&limit=5"
```

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Validation Error",
  "messages": ["Title is required", "Year is invalid"]
}

{
  "error": "Paper not found"
}

{
  "error": "Internal Server Error",
  "message": "Database connection failed"
}
```

## Testing

To run tests (if available):
```bash
npm test
```

## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [SQLite](https://www.sqlite.org/)
- Testing with [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest)