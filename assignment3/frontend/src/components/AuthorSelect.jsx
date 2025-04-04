// This component renders a multi-select dropdown for choosing authors

import { useState, useEffect } from "react";

function AuthorSelect({ selectedAuthorIds, onChange }) {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: Fetch authors from the API when component mounts
  // 1. Use fetch() to GET /api/authors
  // 2. If successful: Set authors data and clear loading
  // 3. If fails (e.g., network error or server error): Set error to "Error loading authors", clear loading
  useEffect(() => {
    // Implementation here
    const fetchAuthors = async () => {
      try {
        const response = await fetch("/api/authors");
        if (!response.ok) {
          throw new Error("Failed to fetch authors");
        }
        const data = await response.json();
        setAuthors(data.authors || data || []);
      } catch (err) {
        setError("Error loading authors");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  // TODO: Handle selection changes and call the onChange prop
  // - Called when user selects authors in the multi-select dropdown
  // - Convert event.target.selectedOptions (HTMLCollection) to an array of numeric IDs
  // - Example: Selecting authors with IDs 1 and 3 yields [1, 3]
  // - Use Number() to convert string values to numbers (API expects numeric IDs)
  // - Pass the array to onChange
  const handleChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions);
    const selectedIds = selectedOptions.map((option) => Number(option.value));
    onChange(selectedIds);
  };

  return (
    <div>
      {loading && <div>Loading authors...</div>}
      {error && <div className="error">{error}</div>}
      <select
        multiple
        value={selectedAuthorIds}
        onChange={handleChange}
        disabled={loading || error}
      >
        {!loading && !error && authors.length === 0 ? (
          <option disabled>No authors available</option>
        ) : (
          authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

export default AuthorSelect;
