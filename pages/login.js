import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useUser } from "./_app";

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setIsCreator } = useUser();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      const roleDoc = await getDoc(doc(db, "roles", auth.currentUser.uid));
      const isCreator = roleDoc.exists() && roleDoc.data().role === "creator";
      localStorage.setItem("qtube_is_creator", isCreator ? "true" : "false");
      setIsCreator(isCreator);
      // redirect home after successful auth
      router.push("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card" style={{maxWidth: 460, margin: "24px auto"}}>
      <h2>{isRegister ? "Create account" : "Sign in"}</h2>
      <p className="muted">Use email/password (Firebase Auth)</p>
      <form onSubmit={handleSubmit}>
        <div className="spacer" />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <div className="spacer" />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div className="spacer" />
        <button type="submit">{isRegister ? "Register" : "Sign in"}</button>
      </form>
      <div className="spacer" />
      {error && <p className="danger card" style={{padding: 8}}>{error}</p>}
      <button className="pill" onClick={()=>setIsRegister(!isRegister)}>
        {isRegister ? "Have an account? Sign in" : "New here? Create account"}
      </button>
      <p className="muted" style={{marginTop: 8}}>
        Note: Developers enrol creators by adding their UID to Firestore collection <code>roles</code> as <code>{"{ role: 'creator' }"}</code>.
      </p>
    </div>
  );
}
