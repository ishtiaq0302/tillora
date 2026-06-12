import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import en from "../locales/en";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem("language") || "en"
  );
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [isRtl, setIsRtl] = useState(false);

  // Load available languages — public endpoint, no auth required
  const loadLanguages = useCallback(async () => {
    try {
      const res = await api.get("/languages");
      setLanguages(res.data?.data || []);
    } catch {
      // fail silently — app works with English defaults
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  // Re-load languages after login (token set externally)
  useEffect(() => {
    const handler = () => loadLanguages();
    window.addEventListener("auth-login", handler);
    return () => window.removeEventListener("auth-login", handler);
  }, [loadLanguages]);

  // Apply direction and lang attribute
  const applyDir = useCallback((rtl, code) => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = code;
  }, []);

  // Fetch translations when language or languages list changes
  useEffect(() => {
    if (currentLang === "en") {
      setTranslations({});
      setIsRtl(false);
      applyDir(false, "en");
      return;
    }

    const langObj = languages.find((l) => l.code === currentLang);
    if (!langObj) {
      setTranslations({});
      setIsRtl(false);
      applyDir(false, currentLang);
      return;
    }

    const rtl = !!langObj.is_rtl;
    setIsRtl(rtl);
    applyDir(rtl, currentLang);

    const token = localStorage.getItem("token");
    if (!token) return;

    api.get(`/translations?language_id=${langObj.id}`)
      .then((res) => {
        const items = res.data?.data || [];
        const map = {};
        items.forEach((item) => {
          if (!map[item.group]) map[item.group] = {};
          map[item.group][item.key] = item.value;
        });
        setTranslations(map);
      })
      .catch(() => setTranslations({}));
  }, [currentLang, languages, applyDir]);

  const setLanguage = useCallback((code) => {
    setCurrentLang(code);
    localStorage.setItem("language", code);
  }, []);

  // t(key, group, fallback)
  const t = useCallback(
    (key, group = "common", fallback) => {
      const apiVal = translations[group]?.[key];
      if (apiVal !== undefined && apiVal !== "") return apiVal;
      const enVal = en[group]?.[key];
      if (enVal !== undefined) return enVal;
      return fallback !== undefined ? fallback : key;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ currentLang, languages, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
