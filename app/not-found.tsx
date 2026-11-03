import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-sub">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div style={{ display:"flex", gap:".8rem", flexWrap:"wrap", justifyContent:"center" }}>
          <Link href="/" className="btn">Go home</Link>
          <Link href="/cook" className="btn out">Search dishes →</Link>
        </div>
      </div>
    </div>
  );
}
