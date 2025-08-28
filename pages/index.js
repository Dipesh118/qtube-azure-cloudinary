import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  limit,
  query,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "./_app";

// Optional: make Cloudinary videos always H.264/AAC for playback
function playableUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com") && u.pathname.includes("/upload/")) {
      const [before, after] = u.pathname.split("/upload/");
      u.pathname = `${before}/upload/f_mp4,vc_h264,ac_aac,q_auto:good/${after}`;
      return u.toString();
    }
  } catch {}
  return url;
}

function VideoCard({ v }) {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Load likes (count + whether I liked)
  useEffect(() => {
    (async () => {
      const lsnap = await getDocs(collection(db, "videos", v.id, "likes"));
      setLikeCount(lsnap.size);
      if (user) {
        const myLike = await getDoc(doc(db, "videos", v.id, "likes", user.uid));
        setLiked(myLike.exists());
      } else {
        setLiked(false);
      }
    })();
  }, [v.id, user]);

  async function toggleLike() {
    if (!user) return alert("Sign in to like");
    const likeRef = doc(db, "videos", v.id, "likes", user.uid);
    if (liked) {
      await deleteDoc(likeRef);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await setDoc(likeRef, { at: serverTimestamp() });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  }

  async function loadComments() {
    const csnap = await getDocs(
      query(collection(db, "videos", v.id, "comments"), orderBy("createdAt", "desc"), limit(3))
    );
    setComments(csnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function postComment(e) {
    e.preventDefault();
    if (!user) return alert("Sign in to comment");
    if (!newComment.trim()) return;
    await addDoc(collection(db, "videos", v.id, "comments"), {
      text: newComment.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    setNewComment("");
    await loadComments();
  }

  return (
    <div className="card video-card">
      <video src={playableUrl(v.videoUrl)} controls preload="metadata" poster={v.thumbnailUrl || undefined} />
      <h3 style={{ marginTop: 8 }}>
        <Link href={`/video/${v.id}`}>{v.title}</Link>
      </h3>
      <div className="row muted">
        <span className="pill">{v.genre || "General"}</span>
        <span className="pill">Age: {v.ageRating || "PG"}</span>
        <span className="pill">By {v.publisher || "Unknown"}</span>
      </div>

      {/* Likes + comment toggle */}
      <div className="row" style={{ marginTop: 8 }}>
        <button className="pill" onClick={toggleLike}>
          {liked ? "♥ Liked" : "♡ Like"} ({likeCount})
        </button>
        <button
          className="pill"
          onClick={async () => {
            const next = !showComments;
            setShowComments(next);
            if (next) await loadComments();
          }}
        >
          {showComments ? "Hide comments" : "Comments"}
        </button>
      </div>

      {/* Inline comments section (last 3) */}
      {showComments && (
        <div className="card" style={{ marginTop: 8 }}>
          <form onSubmit={postComment} className="row">
            <input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
          <div className="spacer" />
          {comments.length === 0 && <p className="muted">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 6 }}>
              <p>{c.text}</p>
              <p className="muted" style={{ fontSize: 12 }}>{c.userId}</p>
            </div>
          ))}
          <p className="muted" style={{ fontSize: 12 }}>
            View more or join the discussion on the{" "}
            <Link href={`/video/${v.id}`}>video page</Link>.
          </p>
        </div>
      )}
    </div>
  );
}

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
        {videos.map(v => <VideoCard key={v.id} v={v} />)}
      </div>
      {videos.length === 0 && <p className="muted">No videos yet. Ask a teacher to enrol a creator and upload a sample.</p>}
    </div>
  );
}
