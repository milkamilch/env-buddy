import { useState, useEffect } from "react";
import { login, register, forgotPassword, resetPassword } from "../services/api";
import "./AuthPage.css";

function getResetToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("reset_token");
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState(() => getResetToken() ? "reset" : "login");
  const [resetToken] = useState(getResetToken);
  const [form, setForm] = useState({
    email: "", password: "", username: "", first_name: "", last_name: "", new_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
        const result = await register({
          email: form.email, password: form.password,
          username: form.username, first_name: form.first_name, last_name: form.last_name,
        });
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("user", JSON.stringify(result.user));
        onAuth(result.user);

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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🧪</div>
        <h1 className="auth-title">Test-Buddy</h1>
        <p className="auth-sub">On-Demand Testumgebungen</p>

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
          <div className="auth-back">
            <button onClick={() => switchMode("login")}>← Zurück zum Login</button>
          </div>
        )}

        {mode === "reset" && (
          <p className="auth-mode-title">Neues Passwort festlegen</p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* REGISTER */}
          {mode === "register" && (
            <>
              <div className="field-row">
                <div className="field">
                  <label>Vorname</label>
                  <input name="first_name" type="text" placeholder="Max" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Name</label>
                  <input name="last_name" type="text" placeholder="Mustermann" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label>Benutzername</label>
                <input name="username" type="text" placeholder="maxmuster" value={form.username} onChange={handleChange} required />
              </div>
            </>
          )}

          {/* EMAIL — login, register, forgot */}
          {mode !== "reset" && (
            <div className="field">
              <label>E-Mail</label>
              <input name="email" type="email" placeholder="max@example.com" value={form.email} onChange={handleChange} required />
            </div>
          )}

          {/* PASSWORD — login, register */}
          {(mode === "login" || mode === "register") && (
            <div className="field">
              <label>Passwort</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
          )}

          {/* NEW PASSWORD — reset */}
          {mode === "reset" && (
            <div className="field">
              <label>Neues Passwort</label>
              <input name="new_password" type="password" placeholder="••••••••" value={form.new_password} onChange={handleChange} required minLength={6} />
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
