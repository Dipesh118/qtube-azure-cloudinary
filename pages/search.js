import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

export default function SearchPage() {
  const [qtext, setQtext] = useState("");
  const [results, setResults] = useState([]);

  async function doSearch(e) {
    e?.preventDefault();
    if (qtext.trim() === "") {
      const qRef = query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(qRef);
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } else {
      const base = query(collection(db, "videos"), orderBy("title"), limit(50));
      const snap = await getDocs(base);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setResults(list.filter(v => v.title?.toLowerCase().includes(qtext.toLowerCase()) || v.genre?.toLowerCase() === qtext.toLowerCase()));
    }
  }

  useEffect(() => { doSearch(); }, []);

  return (
    <div>
      <h1>Search</h1>
      <form onSubmit={doSearch} className="row">
        <input placeholder="Search by title or genre..." value={qtext} onChange={e=>setQtext(e.target.value)} />
        <button type="submit">Search</button>
      </form>
      <div className="spacer" />
      <div className="grid">
        {results.map(v => (
          <div key={v.id} className="card">
            <h3><Link href={`/video/${v.id}`}>{v.title}</Link></h3>
            <video src={v.videoUrl} controls preload="metadata" />
            <div className="row muted">
              <span className="pill">{v.genre || "General"}</span>
              <span className="pill">Age: {v.ageRating || "PG"}</span>
              <span className="pill">By {v.publisher || "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}