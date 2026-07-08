import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import { saveSetting, getSettings } from "../services/settingsService";

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const Header = ({ theme, setTheme, setSidebarOpen, navMode, setNavMode }) => {
  const { user, logout, currentStore, switchStore, canViewAllStores } = useAuth();
  const { t, currentLang, setLanguage, languages } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const settingsBtnRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const profileRef = useRef(null);
  const storeSwitcherRef = useRef(null);
  const langRef = useRef(null);

  // =====================
  // LOAD SETTINGS
  // =====================
  const loadSettings = async (storeId = null) => {
    try {
      const data = await getSettings(storeId);
      const list = Array.isArray(data) ? data : data?.data || [];
      const map = {};
      list.forEach((s) => {
        map[s.key] = s.value;
      });
      if (map.theme) {
        setTheme(map.theme);
        localStorage.setItem("theme", map.theme);
      }
      if (map.nav_mode) {
        setNavMode(map.nav_mode);
        localStorage.setItem("navMode", map.nav_mode);
      }
      if (map.language) {
        setLanguage(map.language);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadSettings(currentStore?.id || null);
    setLogoError(false);
  }, [currentStore?.id]);

  useEffect(() => {
    const storeId = currentStore?.id || null;
    const handler = () => loadSettings(storeId);
    window.addEventListener("store-changed", handler);
    return () => window.removeEventListener("store-changed", handler);
  }, [currentStore?.id]);

  // =====================
  // CLICK OUTSIDE
  // =====================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsOpen && settingsBtnRef.current && !settingsBtnRef.current.contains(e.target) && settingsPanelRef.current && !settingsPanelRef.current.contains(e.target)) setSettingsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (storeSwitcherRef.current && !storeSwitcherRef.current.contains(e.target)) setStoreOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  // =====================
  // TOGGLES
  // =====================
  const toggleSettings = (e) => {
    e.stopPropagation();
    setSettingsOpen((p) => !p);
    setProfileOpen(false);
    setStoreOpen(false);
    setLangOpen(false);
  };
  const toggleProfile = (e) => {
    e.stopPropagation();
    setProfileOpen((p) => !p);
    setSettingsOpen(false);
    setStoreOpen(false);
    setLangOpen(false);
  };
  const toggleStore = (e) => {
    e.stopPropagation();
    setStoreOpen((p) => !p);
    setSettingsOpen(false);
    setProfileOpen(false);
    setLangOpen(false);
  };
  const toggleLang = (e) => {
    e.stopPropagation();
    setLangOpen((p) => !p);
    setSettingsOpen(false);
    setProfileOpen(false);
    setStoreOpen(false);
  };

  // =====================
  // HANDLERS
  // =====================
  const handleThemeChange = async (newTheme) => {
    try {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      await saveSetting({ key: "theme", value: newTheme }, currentStore?.id || null);
      toast.success(t("theme_updated", "header"));
    } catch {
      toast.error(t("theme_failed", "header"));
    }
  };

  const handleNavModeChange = async (mode) => {
    setNavMode(mode);
    localStorage.setItem("navMode", mode);
    setSettingsOpen(false);
    try {
      await saveSetting({ key: "nav_mode", value: mode }, currentStore?.id || null);
    } catch {
      // non-fatal — nav mode is already applied locally
    }
  };

  const handleLangChange = async (code) => {
    setLanguage(code);
    setLangOpen(false);
    try {
      await saveSetting({ key: "language", value: code }, currentStore?.id || null);
    } catch {
      // non-fatal — language is already applied locally
    }
  };

  const ALL_STORES = { id: null, name: t("all_stores", "header") };

  const handleStoreSwitch = (store) => {
    switchStore(store);
    setStoreOpen(false);
    toast.success(`${t("switched_to", "header")} ${store.name}`);
  };

  const handleLogout = () => logout();

  const getInitials = (u) => ((u?.firstName?.[0] || "") + (u?.lastName?.[0] || "")).toUpperCase();

  const stores = [...(user?.stores || [])].sort((a, b) => a.name.localeCompare(b.name));

  const activeLang = languages.find((l) => l.code === currentLang);

  return (
    <div className="hdr">
      {/* ── HAMBURGER ── */}
      <div
        className="hbtn"
        onClick={() => navMode === "vertical" && setSidebarOpen((p) => !p)}
        style={{
          opacity: navMode === "horizontal" ? 0.3 : 1,
          pointerEvents: navMode === "horizontal" ? "none" : "",
        }}
      >
        <svg viewBox="0 0 24 24">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      {/* ── LOGO ── */}
      <div className="logo">
        {currentStore?.logo && !logoError ? (
          <div></div>
        ) : (
          <div className="logo-ic">
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        )}
        {currentStore?.logo && !logoError ? (
          <img src={`${SERVER_URL}${currentStore.logo}`} alt={currentStore.name} className="hidden sm:block" style={{ height: 28, maxWidth: 120, objectFit: "contain" }} onError={() => setLogoError(true)} />
        ) : (
          <div className="logo-tx hidden sm:block">{user?.tenant?.businessName}</div>
        )}
      </div>

      {/* ── SEARCH ── */}
      <div className="srch hidden md:block">
        <span className="srch-ic">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input type="text" placeholder={t("search_placeholder", "header")} />
      </div>

      {/* ── RIGHT SIDE ── */}
      <div className="hdr-r">
        {/* ── STORE SWITCHER ── */}
        {stores.length > 0 && (
          <div style={{ position: "relative" }} ref={storeSwitcherRef}>
            <div className={`hbtn ${storeOpen ? "active-btn" : ""}`} onClick={toggleStore} title={t("switch_store", "header")} style={{ width: "auto", padding: "0 8px", gap: 6, maxWidth: 160 }}>
              <span
                className="hidden sm:block"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--tx)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 110,
                  fontFamily: "var(--font)",
                }}
              >
                {currentStore?.id == null && currentStore ? t("all_stores", "header") : currentStore?.name || t("switch_store", "header")}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="block sm:hidden"
                style={{
                  width: 14,
                  height: 14,
                  stroke: "var(--tx2)",
                  fill: "none",
                  strokeWidth: 1.8,
                  strokeLinecap: "round",
                }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: 11,
                  height: 11,
                  flexShrink: 0,
                  stroke: "var(--tx3)",
                  fill: "none",
                  strokeWidth: 2.5,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  transition: "transform 0.2s",
                  transform: storeOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {storeOpen && (
              <div
                className="settings-panel open"
                style={{
                  right: 0,
                  left: "auto",
                  minWidth: 200,
                  maxWidth: 260,
                  padding: "6px 0",
                }}
              >
                <div className="sp-title" style={{ padding: "4px 12px 8px", marginBottom: 0 }}>
                  {t("switch_store", "header")}
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {(canViewAllStores || user?.stores?.length > 1) &&
                    (() => {
                      const isActive = currentStore?.id == null;
                      return (
                        <div
                          onClick={() => handleStoreSwitch(ALL_STORES)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "7px 12px",
                            cursor: "pointer",
                            background: isActive ? "var(--abg)" : "transparent",
                            transition: "background 0.15s",
                            fontSize: 12.5,
                            color: isActive ? "var(--accent)" : "var(--tx)",
                            fontFamily: "var(--font)",
                            fontWeight: isActive ? 600 : 400,
                            borderBottom: "1px solid var(--bd)",
                            marginBottom: 2,
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "var(--bg3)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              flexShrink: 0,
                              background: isActive ? "var(--accent)" : "var(--inp)",
                              border: "1px solid var(--inpbd)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              style={{
                                width: 13,
                                height: 13,
                                stroke: isActive ? "#fff" : "var(--tx2)",
                                fill: "none",
                                strokeWidth: 2,
                                strokeLinecap: "round",
                              }}
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t("all_stores", "header")}
                            </div>
                            <div
                              style={{
                                fontSize: 10.5,
                                color: "var(--tx3)",
                                marginTop: 1,
                                fontWeight: 400,
                              }}
                            >
                              {t("view_all_stores", "header")}
                            </div>
                          </div>
                          {isActive && (
                            <svg
                              viewBox="0 0 24 24"
                              style={{
                                width: 13,
                                height: 13,
                                flexShrink: 0,
                                stroke: "var(--accent)",
                                fill: "none",
                                strokeWidth: 2.5,
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })()}

                  {stores.map((store) => {
                    const isActive = store.id === currentStore?.id;
                    return (
                      <div
                        key={store.id}
                        onClick={() => handleStoreSwitch(store)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "7px 12px",
                          cursor: "pointer",
                          background: isActive ? "var(--abg)" : "transparent",
                          transition: "background 0.15s",
                          fontSize: 12.5,
                          color: isActive ? "var(--accent)" : "var(--tx)",
                          fontFamily: "var(--font)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = "var(--bg3)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            flexShrink: 0,
                            background: isActive ? "var(--accent)" : "var(--inp)",
                            border: "1px solid var(--inpbd)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: isActive ? "#fff" : "var(--tx2)",
                            letterSpacing: 0.3,
                          }}
                        >
                          {store.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {store.name}
                          </div>
                          {store.code && (
                            <div
                              style={{
                                fontSize: 10.5,
                                color: "var(--tx3)",
                                marginTop: 1,
                                fontWeight: 400,
                              }}
                            >
                              {store.code}
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <svg
                            viewBox="0 0 24 24"
                            style={{
                              width: 13,
                              height: 13,
                              flexShrink: 0,
                              stroke: "var(--accent)",
                              fill: "none",
                              strokeWidth: 2.5,
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    padding: "6px 12px 2px",
                    fontSize: 10.5,
                    color: "var(--tx3)",
                    borderTop: "1px solid var(--bd)",
                    marginTop: 4,
                    fontFamily: "var(--font)",
                  }}
                >
                  {stores.length} {stores.length !== 1 ? t("stores_available", "header") : t("store_available", "header")}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="dvd" />

        {/* ── LANGUAGE SELECTOR ── */}
        {languages.length > 0 && (
          <div style={{ position: "relative" }} ref={langRef}>
            <div className={`hbtn ${langOpen ? "active-btn" : ""}`} onClick={toggleLang} title={t("language", "header")} style={{ width: "auto", padding: "0 8px", gap: 4, minWidth: 32 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--tx2)",
                  fontFamily: "var(--font)",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {activeLang?.code || currentLang}
              </span>
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: 11,
                  height: 11,
                  flexShrink: 0,
                  stroke: "var(--tx3)",
                  fill: "none",
                  strokeWidth: 2.5,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  transition: "transform 0.2s",
                  transform: langOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {langOpen && (
              <div
                className="settings-panel open"
                style={{
                  right: 0,
                  left: "auto",
                  minWidth: 170,
                  padding: "6px 0",
                }}
              >
                <div className="sp-title" style={{ padding: "4px 12px 8px", marginBottom: 0 }}>
                  {t("language", "header")}
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {/* English always available as base */}
                  {[
                    {
                      code: "en",
                      name: "English",
                      native_name: "English",
                      is_rtl: false,
                    },
                    ...languages.filter((l) => l.code !== "en" && l.is_active !== false),
                  ].map((lang) => {
                    const isActive = currentLang === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => handleLangChange(lang.code)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          cursor: "pointer",
                          background: isActive ? "var(--abg)" : "transparent",
                          transition: "background 0.15s",
                          fontSize: 12.5,
                          color: isActive ? "var(--accent)" : "var(--tx)",
                          fontFamily: "var(--font)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = "var(--bg3)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            color: isActive ? "var(--accent)" : "var(--tx3)",
                            minWidth: 24,
                          }}
                        >
                          {lang.code}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div>{lang.name}</div>
                          {lang.native_name && lang.native_name !== lang.name && (
                            <div
                              style={{
                                fontSize: 10.5,
                                color: "var(--tx3)",
                                marginTop: 1,
                              }}
                            >
                              {lang.native_name}
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <svg
                            viewBox="0 0 24 24"
                            style={{
                              width: 12,
                              height: 12,
                              flexShrink: 0,
                              stroke: "var(--accent)",
                              fill: "none",
                              strokeWidth: 2.5,
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="dvd" />

        {/* ── SETTINGS ── */}
        <div style={{ position: "relative" }}>
          <div ref={settingsBtnRef} className={`hbtn ${settingsOpen ? "active-btn" : ""}`} onClick={toggleSettings} title={t("appearance_settings", "header")}>
            <svg viewBox="0 0 24 24">
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
              <path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.34 6.34l1.42 1.42m8.48 8.48l1.42 1.42M6.34 17.66l1.42-1.42m8.48-8.48l1.42-1.42" />
            </svg>
          </div>

          {settingsOpen && (
            <div className="settings-panel open" ref={settingsPanelRef}>
              <div className="sp-title">{t("appearance_settings", "header")}</div>

              {/* THEME */}
              <div className="sp-sec">
                <div className="sp-lbl">{t("color_theme", "header")}</div>
                <div className="sp-opts">
                  {[
                    {
                      key: "dark",
                      icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
                      label: t("dark", "header"),
                    },
                    {
                      key: "light",
                      icon: (
                        <>
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </>
                      ),
                      label: t("light", "header"),
                    },
                    {
                      key: "blue",
                      icon: <path d="M12 2L2 12h4v8h12v-8h4z" />,
                      label: t("blue", "header"),
                    },
                  ].map(({ key, icon, label }) => (
                    <div key={key} className={`sp-opt ${theme === key ? "active" : ""}`} onClick={() => handleThemeChange(key)}>
                      <div className="sp-opt-ic">
                        <svg viewBox="0 0 24 24">{icon}</svg>
                      </div>
                      <div className="sp-opt-lb">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NAV MODE */}
              <div className="sp-sec" style={{ marginBottom: 0 }}>
                <div className="sp-lbl">{t("navigation_layout", "header")}</div>
                <div className="sp-opts">
                  <div className={`sp-opt ${navMode === "vertical" ? "active" : ""}`} onClick={() => handleNavModeChange("vertical")}>
                    <div className="sp-opt-ic">
                      <svg viewBox="0 0 36 28" width="36" height="28">
                        <rect x="0" y="0" width="10" height="28" rx="2" fill="currentColor" opacity=".15" />
                        <rect x="1" y="3" width="8" height="2" rx="1" fill="currentColor" opacity=".5" />
                        <rect x="1" y="7" width="8" height="2" rx="1" fill="currentColor" opacity=".35" />
                        <rect x="1" y="11" width="8" height="2" rx="1" fill="currentColor" opacity=".35" />
                        <rect x="12" y="0" width="24" height="4" rx="1" fill="currentColor" opacity=".1" />
                        <rect x="12" y="6" width="24" height="3" rx="1" fill="currentColor" opacity=".08" />
                        <rect x="12" y="11" width="24" height="3" rx="1" fill="currentColor" opacity=".08" />
                      </svg>
                    </div>
                    <div className="sp-opt-lb">{t("vertical", "header")}</div>
                  </div>
                  <div className={`sp-opt ${navMode === "horizontal" ? "active" : ""}`} onClick={() => handleNavModeChange("horizontal")}>
                    <div className="sp-opt-ic">
                      <svg viewBox="0 0 36 28" width="36" height="28">
                        <rect x="0" y="0" width="36" height="5" rx="1" fill="currentColor" opacity=".15" />
                        <rect x="1" y="1.5" width="5" height="2" rx="1" fill="currentColor" opacity=".5" />
                        <rect x="8" y="1.5" width="5" height="2" rx="1" fill="currentColor" opacity=".35" />
                        <rect x="15" y="1.5" width="5" height="2" rx="1" fill="currentColor" opacity=".35" />
                        <rect x="0" y="7" width="36" height="3" rx="1" fill="currentColor" opacity=".1" />
                        <rect x="0" y="12" width="36" height="3" rx="1" fill="currentColor" opacity=".08" />
                      </svg>
                    </div>
                    <div className="sp-opt-lb">{t("horizontal", "header")}</div>
                  </div>
                </div>
                <div className="sp-hint">{navMode === "vertical" ? t("sidebar_hint", "header") : t("topbar_hint", "header")}</div>
              </div>
            </div>
          )}
        </div>

        <div className="dvd" />

        {/* ── PROFILE ── */}
        <div ref={profileRef} className={`profile-trigger ${profileOpen ? "open" : ""}`} onClick={toggleProfile}>
          <div className="av">{getInitials(user)}</div>

          <div className="uinf hidden sm:flex">
            <span className="uname">{user ? `${user.firstName} ${user.lastName || ""}` : "Super Admin"}</span>
            <span className="urole">{user?.roles?.[0]}</span>
          </div>

          <svg className="chevron-sm hidden sm:block" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>

          {profileOpen && (
            <div className="profile-dd" onClick={(e) => e.stopPropagation()}>
              <div className="pd-header">
                <div className="pd-av">{getInitials(user)}</div>
                <div>
                  <div className="pd-name">{user ? `${user.firstName} ${user.lastName || ""}` : "Super Admin"}</div>
                  <div className="pd-email">{user ? user.email : "super@admin.com"}</div>
                  <span className="pd-badge">{user?.roles?.[0]}</span>
                </div>
              </div>
              <div className="pd-divider" />
              <div className="pd-section" style={{ paddingTop: 4 }}>
                <div className="pd-item danger" onClick={handleLogout} style={{ cursor: "pointer" }}>
                  <svg viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{t("sign_out", "header")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
