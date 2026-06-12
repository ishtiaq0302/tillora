import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import HorizontalNav from "./HorizontalNav";
import { useAuth } from "../context/AuthContext";

function TrialBanner() {
  const { user } = useAuth();
  const status = user?.tenant?.subscriptionStatus;
  const trialEndsAt = user?.tenant?.trialEndsAt;
  const subscriptionEndsAt = user?.tenant?.subscriptionEndsAt;

  // ── Determine what to show ──
  let days = null;
  let expired = false;
  let isTrial = false;

  if (status === "trial" && trialEndsAt) {
    days = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    expired = days <= 0;
    isTrial = true;
  } else if (status === "active" && subscriptionEndsAt) {
    days = Math.ceil((new Date(subscriptionEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    expired = days <= 0;
    isTrial = false;
    // For paid plans only show when ≤5 days remain (not the whole subscription period)
    if (!expired && days > 5) return null;
  } else {
    return null;
  }

  const bg = expired
    ? "var(--red)"
    : days <= 3
      ? "var(--amber)"
      : days <= 7
        ? "var(--accent)"
        : "#5B21B6";

  const label = expired
    ? isTrial
      ? "Your free trial has expired!"
      : "Your subscription has expired!"
    : isTrial
      ? `Free trial: ${days} day${days !== 1 ? "s" : ""} remaining`
      : `Subscription expires in ${days} day${days !== 1 ? "s" : ""}`;

  const cta = expired ? "Choose a Plan" : isTrial ? "Upgrade Now" : "Renew Now";

  return (
    <div style={{
      background: bg,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      padding: "7px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      zIndex: 5,
    }}>
      <span>{label}</span>
      <Link to="/billing" style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}>
        {cta}
      </Link>
    </div>
  );
}

const MainLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [navMode, setNavMode] = useState(localStorage.getItem("navMode") || "vertical");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`adm ${theme}`} id="adm">
      <Header
        theme={theme}
        setTheme={setTheme}
        setSidebarOpen={setSidebarOpen}
        navMode={navMode}
        setNavMode={setNavMode}
      />
      <TrialBanner />

      <div className={`body ${navMode}`} id="bodyWrap">
        {/* Vertical Sidebar */}
        {navMode === "vertical" && (
          <Sidebar sidebarOpen={sidebarOpen} />
        )}

        {/* Mobile backdrop — only in vertical mode on mobile when sidebar is open */}
        {navMode === "vertical" && sidebarOpen && isMobile && (
          <div className="sbar-backdrop" onClick={closeSidebar} />
        )}

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {navMode === "horizontal" && (
            <HorizontalNav />
          )}
          <main>{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
