// This component handles editing an existing paper

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PaperForm from "../components/PaperForm";

function EditPaper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // TODO: Fetch paper data when component mounts
  // 1. Use fetch() to GET /api/papers/${id}
  // 2. If successful: Set paper data and clear loading
  // 3. If fails (e.g., network error):
  //    - Set error to "Error loading paper"
  //    - Clear loading
  // 4. If paper not found (e.g., res.status === 404)
  //    - Set paper to null to trigger "Paper not found"
  //    - Clear loading
  //    - Return to prevent unnecessary res.json()
  useEffect(() => {
    fetch(`/api/papers/${id}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Error loading paper");
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setPaper(null);
          setLoading(false);
          return;
        }
        setPaper(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error loading paper");
        setLoading(false);
      });
  }, [id]);

  // TODO: Implement function to handle paper updates
  // 1. Send PUT request to /api/papers/${id} with updatedPaper:
  // const updatedPaper = {
  //   title: paperData.title,
  //   publishedIn: paperData.publishedIn,
  //   year: paperData.year,
  //   authors: paper.authors.map((author) => ({
  //     name: author.name,
  //     email: author.email,
  //     affiliation: author.affiliation,
  //   })),
  // };
  // 2. If successful:
  //    - Set message to "Paper updated successfully"
  //    - Navigate to home page "/"
  // 3. If fails: Set message to "Error updating paper"
  // Note that authors are displayed but cannot be edited (for simplicity)
  const handleUpdatePaper = async (paperData) => {
    try {
      const updatedPaper = {
        ...paperData,
        authors: paper.authors,
      };
      const res = await fetch(`/api/papers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPaper),
      });
      if (!res.ok) throw new Error();
      setMessage("Paper updated successfully");
      setTimeout(() => navigate("/"), 3000);
    } catch {
      setMessage("Error updating paper");
    }
  };

  if (loading) return <div>Loading paper details...</div>;
  if (error) return <div>Error loading paper</div>;
  if (!paper) return <div>Paper not found</div>;

  return (
    <div>
      <h1>Edit Paper</h1>
      <PaperForm paper={paper} onSubmit={handleUpdatePaper} />
      {message && <div>{message}</div>}
      {/* Added */}
      <button onClick={() => navigate("/")}>Cancel</button>
    </div>
  );
}

export default EditPaper;
