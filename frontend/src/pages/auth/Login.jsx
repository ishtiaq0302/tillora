import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import authService from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({ email: "admin@gmail.com", password: "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await authService.login(form);
      login(res.data);
      // Notify LanguageContext to reload languages now that we have a token
      window.dispatchEvent(new Event("auth-login"));
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || t("login_failed", "auth"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2>{t("login", "auth")}</h2>

        {error && <p className="error">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder={t("email", "auth")}
          value={form.email}
          onChange={handleChange}
          required
          autoFocus
        />

        <input
          type="password"
          name="password"
          placeholder={t("password", "auth")}
          value={form.password}
          onChange={handleChange}
          required
        />

        <button disabled={loading}>
          {loading ? t("loading", "auth") : t("login", "auth")}
        </button>

        <p>
          {t("no_account", "auth")}
          <Link to="/signup"> {t("signup", "auth")}</Link>
        </p>
      </form>
    </div>
  );
}
