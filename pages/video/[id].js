import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, orderBy, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { useUser } from "../_app";

export default function VideoDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [myComment, setMyComment] = useState("");
  const [avgRating, setAvgRating] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const vdoc = await getDoc(doc(db, "videos", id));
      if (vdoc.exists()) setVideo({ id: vdoc.id, ...vdoc.data() });
      const q = query(collection(db, "videos", id, "comments"), orderBy("createdAt", "desc"));
      const csnap = await getDocs(q);
      setComments(csnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const rsnap = await getDocs(collection(db, "videos", id, "ratings"));
      const ratings = rsnap.docs.map(d => d.data().rating || 0);
      const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(1) : null;
      setAvgRating(avg);
    })();
  }, [id]);

  async function loadComments() {
  const q = query(collection(db, "videos", id, "comments"), orderBy("createdAt", "desc"));
  const csnap = await getDocs(q);
  setComments(csnap.docs.map(d => ({ id: d.id, ...d.data() })));
}

async function postComment(e) {
  e.preventDefault();
  if (!user) { alert("Sign in to comment"); return; }

  // Call Azure sentiment (fallback to neutral)
  let senti = { label: "neutral", scores: { positive: 0, neutral: 1, negative: 0 } };
  try {
    const r = await fetch(process.env.NEXT_PUBLIC_SENTIMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: myComment })
    });
    if (r.ok) senti = await r.json();
  } catch (err) {
    console.error("sentiment error", err);
  }

  // Save comment with sentiment
  await addDoc(collection(db, "videos", id, "comments"), {
    text: myComment,
    userId: user.uid,
    createdAt: serverTimestamp(),
    sentiment: senti.label,
    sentimentScores: senti.scores
  });

  setMyComment("");
  // reload comments if you have a loader
  if (typeof loadComments === "function") await loadComments();
}

  async function postRating(value) {
    if (!user) return alert("Sign in to rate");
    await setDoc(doc(db, "videos", id, "ratings", user.uid), { rating: value, at: serverTimestamp() });
    const rsnap = await getDocs(collection(db, "videos", id, "ratings"));
    const ratings = rsnap.docs.map(d => d.data().rating || 0);
    const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(1) : null;
    setAvgRating(avg);
  }

  if (!video) return <p className="muted">Loading...</p>;

  return (
    <div className="card">
      <h1>{video.title}</h1>
      <p className="muted">Publisher: {video.publisher || "Unknown"} • Producer: {video.producer || "Unknown"} • Genre: {video.genre || "General"} • Age: {video.ageRating || "PG"}</p>
      <video src={video.videoUrl} controls style={{width:"100%", maxHeight: "70vh"}} />

  {video.transcriptShort && (
  <>
    <div className="spacer" />
    <div className="card">
      <strong>Transcript (first 60s):</strong>
      <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
        {video.transcriptShort}
      </p>
    </div>
  </>
)}

      <div className="spacer" />
      <div className="row">
        <span className="pill">Average rating: {avgRating ?? "—"}</span>
        {[1,2,3,4,5].map(n => (
          <button key={n} className="pill" onClick={()=>postRating(n)}>{n}★</button>
        ))}
      </div>
      <div className="spacer" />
      <h3>Comments</h3>
      <form onSubmit={postComment} className="row">
        <input placeholder="Write a comment..." value={myComment} onChange={e=>setMyComment(e.target.value)} />
        <button type="submit">Post</button>
      </form>
      <div className="spacer" />
{comments.map(c => (
  <div key={c.id} className="card" style={{ marginBottom: 8 }}>
    <p>{c.text}</p>
    <p className="muted" style={{ fontSize: 12 }}>
      {c.userId}
      {c.sentiment && <span className="pill" style={{ marginLeft: 8 }}>{c.sentiment}</span>}
    </p>
  </div>
))}
    </div>
  );
}
