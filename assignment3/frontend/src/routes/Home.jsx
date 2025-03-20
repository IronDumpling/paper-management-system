// This component serves as the home page, displaying the paper list and create form
import { useState, useEffect } from "react";
import PaperList from "../components/PaperList";
import PaperForm from "../components/PaperForm";
import styles from "../styles/Home.module.css";

function Home() {
  const [message, setMessage] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: Implement paper creation
  // 1. Fetch all authors (GET /api/authors) and filter them using paperData.authorIds to create the authors array
  // 2. Send POST request to /api/papers with { title, publishedIn, year, authors }
  // 3. If successful:
  //    - Set message to "Paper created successfully"
  //    - After a 3-second delay, refresh page to show new paper using location.reload()
  //    Note: Refreshing the page is not the best practice in React applications
  //    because it:
  //    - Goes against React's single-page application philosophy
  //    - Provides worse user experience (screen flashes)
  //    - Is less efficient (reloads all resources)
  //    A better solution would be to update the component's state,
  //    but for simplicity in this assignment, we'll use page refresh.
  // 4. If request fails:
  //    - Set message to "Error creating paper"

  useEffect(() => {
    fetch("/api/papers")
      .then((res) => {
        if (!res.ok) throw new Error("Error loading papers");
        return res.json();
      })
      .then((data) => {
        setPapers(data.papers || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error loading papers");
        setLoading(false);
      });
  }, []);

  const handleCreatePaper = async (paperData) => {
    try {
      // 1. Fetch all authors to get their details
      const authorsRes = await fetch("/api/authors");
      if (!authorsRes.ok) throw new Error("Error fetching authors");
      const authorsData = await authorsRes.json();
      
      // 2. Filter and map selected authors to the required format
      const selectedAuthors = (authorsData.authors || authorsData || [])
        .filter(author => paperData.authorIds.includes(author.id))
        .map(author => ({
          name: author.name,
          email: author.email || null,
          affiliation: author.affiliation || null
        }));

      // 3. Submit paper with complete author data
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paperData.title,
          publishedIn: paperData.publishedIn,
          year: paperData.year,
          authors: selectedAuthors
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create paper");
      }
      
      setMessage("Paper created successfully");
      const newPaper = await res.json();
      setPapers(prev => [...prev, newPaper]);
    } catch {
      setMessage("Error creating paper");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Paper Management System</h1>

      {message && <div>{message}</div>}

      <h2 className={styles.sectionTitle}>Create New Paper</h2>
      <PaperForm onSubmit={handleCreatePaper} />

      <h2 className={styles.sectionTitle}>Papers</h2>
      {
        loading ? (
          <div>Loading papers...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <PaperList papers={papers}/>
        )
      }
    </div>
  );
}

export default Home;
