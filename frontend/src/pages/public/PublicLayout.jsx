import { Link } from "react-router-dom";

export default function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--tx)" }}>
      {/* Navbar */}
      <header
        style={{
          background: "var(--bg2)",
          borderBottom: "1px solid var(--bd)",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30, height: 30,
              background: "var(--accent)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 14,
            }}
          >
            F
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--tx)" }}>Fincode POS</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link to="/pricing" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Pricing</Link>
          <Link to="/terms" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Privacy</Link>
          <Link
            to="/login"
            style={{
              fontSize: 13, color: "var(--tx)", textDecoration: "none",
              border: "1px solid var(--bd)", borderRadius: "var(--r)",
              padding: "6px 14px", fontWeight: 500,
            }}
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 13, color: "#fff", textDecoration: "none",
              background: "var(--accent)", borderRadius: "var(--r)",
              padding: "6px 14px", fontWeight: 600,
            }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--bd)",
          padding: "32px",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Fincode POS</div>
              <div style={{ fontSize: 12, color: "var(--tx3)", maxWidth: 240 }}>
                Modern point-of-sale software for businesses of all sizes.
              </div>
            </div>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 10 }}>Product</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link to="/pricing" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Pricing</Link>
                  <Link to="/signup" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Sign Up</Link>
                  <Link to="/login" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Sign In</Link>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 10 }}>Legal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link to="/terms" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Terms of Service</Link>
                  <Link to="/privacy" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Privacy Policy</Link>
                  <Link to="/refund-policy" style={{ fontSize: 13, color: "var(--tx2)", textDecoration: "none" }}>Refund Policy</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--bd)", fontSize: 12, color: "var(--tx3)" }}>
            © {new Date().getFullYear()} Fincode POS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
