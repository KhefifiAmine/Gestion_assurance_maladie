import React, { useState } from "react";
import "./Auth.css";
import { validateEmail } from "../utils/authUtils";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const mailErr = validateEmail(email);

    if (mailErr) {
      setEmailError(mailErr);
      return;
    }
    setEmailError("");

    try {
      setIsLoading(true);
      const data = await loginUser(email, password);
      login(data.token, data.user);

      if (data.user.role === 'ADMIN') {
        navigate("/admin/users");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setApiError(err.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isShaking ? "shake-animation" : ""}>
      <div className="auth-header" style={{ position: 'relative' }}>
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            color: theme === 'dark' ? '#facc15' : '#475569'
          }}
          type="button"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <h2>Connexion</h2>
        <p>Connectez-vous à votre compte</p>
      </div>
      <form onSubmit={handleSubmit}>
        {apiError && (
          <div className="api-error-banner">
            <span style={{ marginRight: "8px" }}>⚠️</span>
            {apiError}
          </div>
        )}
        <div className="form-group">
          <label>Emaill :</label>
          <input
            type="text"
            placeholder="Entrer votre Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (apiError) setApiError("");
            }}
            className={emailError ? "invalid" : ""}
            required
          />
          {emailError && <span className="error-message">{emailError}</span>}
        </div>
        <div className="form-group">
          <label>Mot de passe :</label>
          <input
            type="password"
            placeholder="Entrer votre Mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (apiError) setApiError("");
            }}
            className={emailError ? "invalid" : ""}
            required
          />
          {emailError && (
            <span className="error-message">{emailError}</span>
          )}
        </div>
        <Link to="/forgot-password" style={{ marginLeft: '10px', textDecoration: 'underline' }}>
          Mot de passe oublié ?
        </Link>
        <button type="submit" className="submit-btn" disabled={isLoading} style={{ width: '80%', margin: '20px auto', display: 'block' }}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="auth-footer">
        <span>Vous n'avez un compte? </span>
        <Link to="/register">
          <span className="auth-link">S'inscrire</span>
        </Link>
      </div>
    </div>
  );
};

export default Login;
