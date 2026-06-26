import { useState, useEffect } from "react";
import { login, register, forgotPassword, resetPassword, verifyEmail } from "../services/api";
import "./AuthPage.css";

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export default function AuthPage({ onAuth }) {
  const [resetToken]  = useState(() => getUrlParam("reset_token"));
  const [verifyToken] = useState(() => getUrlParam("verify_token"));

  const [mode, setMode] = useState(() => {
    if (getUrlParam("reset_token"))  return "reset";
    if (getUrlParam("verify_token")) return "verifying";
    return "login";
  });

  const [form, setForm] = useState({
    email: "", password: "", username: "", first_name: "", last_name: "", new_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  // Automatisch verifizieren wenn verify_token in URL
  useEffect(() => {
    if (mode !== "verifying" || !verifyToken) return;
    verifyEmail(verifyToken)
      .then(() => {
        window.history.replaceState({}, "", "/");
        setSuccess("E-Mail erfolgreich bestätigt! Du kannst dich jetzt anmelden.");
        setMode("login");
      })
      .catch((err) => {
        window.history.replaceState({}, "", "/");
        setError(err.message);
        setMode("login");
      });
  }, [mode, verifyToken]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function switchMode(m) {
    setMode(m);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "login") {
        const result = await login(form.email, form.password);
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("user", JSON.stringify(result.user));
        onAuth(result.user);

      } else if (mode === "register") {
        await register({
          email: form.email, password: form.password,
          username: form.username, first_name: form.first_name, last_name: form.last_name,
        });
        setMode("verify-pending");

      } else if (mode === "forgot") {
        await forgotPassword(form.email);
        setSuccess("Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.");

      } else if (mode === "reset") {
        await resetPassword(resetToken, form.new_password);
        setSuccess("Passwort erfolgreich geändert! Du kannst dich jetzt anmelden.");
        window.history.replaceState({}, "", "/");
        setTimeout(() => switchMode("login"), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Verify pending screen ─────────────────────────────────────────────────
  if (mode === "verify-pending") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">🧪</span>
            <span className="auth-brand-name">env-buddy</span>
          </div>
          <h1 className="auth-title">E-Mail bestätigen</h1>
          <p className="auth-subtitle">
            Wir haben dir einen Bestätigungslink geschickt.<br />
            Bitte prüfe dein Postfach und klicke auf den Link, um deinen Account zu aktivieren.
          </p>
          <button className="auth-link" onClick={() => switchMode("login")}>
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  // ── Verifying screen (kurz sichtbar während JWT geprüft wird) ─────────────
  if (mode === "verifying") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">🧪</span>
            <span className="auth-brand-name">env-buddy</span>
          </div>
          <h1 className="auth-title">E-Mail wird bestätigt…</h1>
          <span className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">🧪</span>
          <span className="auth-brand-name">env-buddy</span>
        </div>
        <h1 className="auth-title">
          {mode === "reset" ? "Neues Passwort festlegen" : mode === "forgot" ? "Passwort zurücksetzen" : "Willkommen"}
        </h1>

        {mode !== "forgot" && mode !== "reset" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
              Anmelden
            </button>
            <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
              Registrieren
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <button className="auth-link" onClick={() => switchMode("login")}>← Zurück zum Login</button>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* REGISTER */}
          {mode === "register" && (
            <>
              <div className="auth-field-row">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="first_name">Vorname</label>
                  <input id="first_name" className="auth-input" name="first_name" type="text" placeholder="Max" value={form.first_name} onChange={handleChange} required autoComplete="given-name" />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="last_name">Name</label>
                  <input id="last_name" className="auth-input" name="last_name" type="text" placeholder="Mustermann" value={form.last_name} onChange={handleChange} required autoComplete="family-name" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">Benutzername</label>
                <input id="username" className="auth-input" name="username" type="text" placeholder="maxmuster" value={form.username} onChange={handleChange} required autoComplete="username" />
              </div>
            </>
          )}

          {/* EMAIL — login, register, forgot */}
          {mode !== "reset" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">E-Mail</label>
              <input id="email" className="auth-input" name="email" type="email" placeholder="max@example.com" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
          )}

          {/* PASSWORD — login, register */}
          {(mode === "login" || mode === "register") && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Passwort</label>
              <input id="password" className="auth-input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
          )}

          {/* NEW PASSWORD — reset */}
          {mode === "reset" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="new_password">Neues Passwort</label>
              <input id="new_password" className="auth-input" name="new_password" type="password" placeholder="••••••••" value={form.new_password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
            </div>
          )}

          {error   && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Bitte warten..." : {
              login:    "Anmelden",
              register: "Konto erstellen",
              forgot:   "Reset-Link senden",
              reset:    "Passwort speichern",
            }[mode]}
          </button>
        </form>

        {mode === "login" && (
          <button className="auth-link" onClick={() => switchMode("forgot")}>
            Passwort vergessen?
          </button>
        )}
      </div>
    </div>
  );
}
