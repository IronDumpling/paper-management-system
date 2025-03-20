// This component displays a list of papers with edit and delete buttons

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/PaperList.module.css";

function PaperList({ papers: propPapers, loading: propLoading, error: propError }) {
  const [internalPapers, setInternalPapers] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  // Determine if we're using props or internal state
  const usingProps = typeof propPapers !== 'undefined';
  const papers = usingProps ? propPapers : internalPapers;
  const loading = usingProps ? propLoading : internalLoading;
  const error = usingProps ? propError : internalError;

  // TODO: Fetch papers from the API when component mounts
  // 1. Use fetch() to GET /api/papers
  // 2. If successful: Set papers data and clear loading
  // 3. If fails (e.g., network error or server error): Set error to "Error loading papers", clear loading
  useEffect(() => {
    if (!usingProps) {
      const fetchPapers = async () => {
        try {
          const response = await fetch("/api/papers");
          if (!response.ok) throw new Error("Error loading papers");
          const data = await response.json();
          setInternalPapers(data.papers || data || []);
          setInternalLoading(false);
        } catch (err) {
          setInternalError("Error loading papers");
          setInternalLoading(false);
        }
      };
      fetchPapers();
    }
  }, [usingProps]);

  // TODO: Implement delete functionality
  // 1. Show the browser's built-in confirmation dialog using `confirm()`:
  //    - This will show a dialog with "OK" and "Cancel" buttons
  //    - Example: if (confirm(`Are you sure you want to delete "${paperTitle}"?`))
  // 2. If user clicks "OK":
  //    - Send DELETE request to /api/papers/${paperId}
  //    - Remove paper from list if successful
  //    - Set message to "Paper deleted successfully"
  // 3. If deletion fails:
  //    - Set message to "Error deleting paper"
  // 4. If user clicks "Cancel":
  //    - Do nothing (dialog will close automatically)
  const handleDelete = async (paperId, paperTitle) => {
    if (!confirm(`Are you sure you want to delete "${paperTitle}"?`)) return;

    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error deleting paper");
      
      // Update state based on data source
      if (usingProps) {
        // If using props, expect parent to refresh data
        setMessage("Paper deleted successfully");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setInternalPapers(prev => prev.filter(paper => paper.id !== paperId));
        setMessage("Paper deleted successfully");
      }
    } catch (err) {
      setMessage("Error deleting paper");
    }
  };

  if (loading) return <div>Loading papers...</div>;
  if (error) return <div>{error}</div>;
  if (!loading && papers.length === 0) return <div>No papers found</div>;

  return (
    <div className={styles.container}>
      {message && <div>{message}</div>}
      {papers.map((paper) => (
        <div key={paper.id} className={styles.paper} data-testid={`paper-${paper.id}`}>
          <h3 className={styles.paperTitle}>{paper.title}</h3>
          <p>Published in {paper.publishedIn}, {paper.year}</p>
          <p>Authors: {paper.authors.map((author) => author.name).join(", ")}</p>
          <button onClick={() => navigate(`/edit/${paper.id}`)}>Edit</button>
          <button onClick={() => handleDelete(paper.id, paper.title)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default PaperList;