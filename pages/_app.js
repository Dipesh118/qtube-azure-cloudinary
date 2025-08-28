import "@/styles/globals.css";
import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function NavBar() {
  const { user, isCreator } = useUser();
  return (
    <header>
      <nav className="container">
        <div className="row" style={{justifyContent: "space-between", width: "100%"}}>
          <Link href="/" className="brand">QTube</Link>
          <div className="row">
            <Link className="pill" href="/">Dashboard</Link>
            <Link className="pill" href="/search">Search</Link>
            {isCreator ? <Link className="pill" href="/upload">Upload</Link> : null}
            {!user && <Link className="pill" href="/login">Sign in</Link>}
            {user && (
              <button className="pill" onClick={() => signOut(auth)}>Sign out</button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (typeof window !== "undefined") {
        const v = localStorage.getItem("qtube_is_creator") === "true";
        setIsCreator(v);
      }
    });
    return () => unsub();
  }, []);

  return (
    <UserContext.Provider value={{ user, isCreator, setIsCreator }}>
      <NavBar />
      <main className="container"><Component {...pageProps} /></main>
    </UserContext.Provider>
  );
}