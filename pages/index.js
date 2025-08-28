import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";

export default function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVideos(list);
    })();
  }, []);

  return (
    <div>
      <h1>Latest videos</h1>
      <p className="muted">Fresh uploads from verified creators.</p>
      <div className="spacer" />
      <div className="grid">
        {videos.map(v => (
          <div key={v.id} className="card video-card">
            <video src={v.videoUrl} controls preload="metadata" poster={v.thumbnailUrl || undefined} />
            <h3 style={{marginTop: 8}}><Link href={`/video/${v.id}`}>{v.title}</Link></h3>
            <div className="row muted">
              <span className="pill">{v.genre || "General"}</span>
              <span className="pill">Age: {v.ageRating || "PG"}</span>
              <span className="pill">By {v.publisher || "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
      {videos.length === 0 && <p className="muted">No videos yet. Ask a teacher to enrol a creator and upload a sample.</p>}
    </div>
  );
}