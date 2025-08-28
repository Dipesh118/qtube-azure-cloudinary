import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "./_app";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function Upload() {
  const { user, isCreator, setIsCreator } = useUser();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState({ title: "", publisher: "", producer: "", genre: "", ageRating: "PG" });
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (user) {
        const roleDoc = await getDoc(doc(db, "roles", user.uid));
        const creator = roleDoc.exists() && roleDoc.data().role === "creator";
        localStorage.setItem("qtube_is_creator", creator ? "true" : "false");
        setIsCreator(creator);
      }
    })();
  }, [user, setIsCreator]);

  if (!user) return <p className="muted">Please sign in first.</p>;
  if (!isCreator) return <p className="muted">Only creators can upload. Ask a teacher to enrol you.</p>;

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    try {
      if (!file) throw new Error("Select a video file");
      if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Cloudinary env vars missing");

      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      form.append("public_id", uuidv4());
      form.append("resource_type", "video");

      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Cloudinary returns secure_url
      const url = data.secure_url;
      const docRef = await addDoc(collection(db, "videos"), {
        title: meta.title,
        publisher: meta.publisher,
        producer: meta.producer,
        genre: meta.genre,
        ageRating: meta.ageRating,
        videoUrl: url,
        creatorId: user.uid,
        createdAt: serverTimestamp()
      });
      router.push(`/video/${docRef.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card" style={{maxWidth: 700, margin: "24px auto"}}>
      <h2>Upload a video</h2>
      <p className="muted">Uses Cloudinary unsigned uploads (free tier). MP4/WEBM are fine.</p>
      <form onSubmit={handleUpload}>
        <div className="grid" style={{gridTemplateColumns: "1fr 1fr"}}>
          <input placeholder="Title" value={meta.title} onChange={e=>setMeta({...meta, title: e.target.value})} required />
          <input placeholder="Publisher" value={meta.publisher} onChange={e=>setMeta({...meta, publisher: e.target.value})} required />
          <input placeholder="Producer" value={meta.producer} onChange={e=>setMeta({...meta, producer: e.target.value})} />
          <input placeholder="Genre" value={meta.genre} onChange={e=>setMeta({...meta, genre: e.target.value})} />
          <select value={meta.ageRating} onChange={e=>setMeta({...meta, ageRating: e.target.value})}>
            <option>PG</option>
            <option>12</option>
            <option>15</option>
            <option>18</option>
          </select>
          <input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="spacer" />
        <button type="submit">Upload</button> <span className="muted">{progress ? `${progress}%` : ""}</span>
      </form>
      {error && <p className="danger card" style={{padding: 8, marginTop: 12}}>{error}</p>}
    </div>
  );
}