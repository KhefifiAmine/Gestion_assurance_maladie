import React, { useState } from "react";
import "./Auth.css";
import tunisieTelecomImg from "../assets/Tunisie_Telecom.jpg";
import { validateEmail, validatePassword } from "../utils/authUtils";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const Login = ({ onGoToRegister }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const mailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (mailErr || passErr) {
      setEmailError(mailErr);
      setPasswordError(passErr);
      return;
    }
    setEmailError("");
    setPasswordError("");

    try {
      setIsLoading(true);
      const data = await loginUser(email, password);
      login(data.token, data.user); // Stocker dans le Context
      
      // Redirection intelligente selon le rôle
      if (data.user.role === 'ADMIN') {
        navigate("/admin/users");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setApiError(err.message);
      setIsShaking(true);
      // Reset shaking after animation finishes so it can be triggered again
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isShaking ? "shake-animation" : ""}>
      {/* Formulaire de connexion */}
      <div className="auth-header" style={{ position: 'relative' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            position: 'absolute', 
            top: '-20px', 
            right: '-10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '50%',
            color: theme === 'dark' ? '#facc15' : '#475569'
          }}
          type="button"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
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
          <label>Email :</label>
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
              if (passwordError) setPasswordError("");
              if (apiError) setApiError("");
            }}
            className={passwordError ? "invalid" : ""}
            required
          />
          {passwordError && (
            <span className="error-message">{passwordError}</span>
          )}
          <div style={{ textAlign: "right", marginTop: "8px" }}>
            <span
              className="auth-link"
              style={{ fontSize: "14px", fontWeight: "500" }}
            >
              Mot de passe oublié ?
            </span>
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="auth-footer">
        <span>Vous n'avez pas de compte ? </span>
        <Link to="/register">
          <span className="auth-link">S'inscrire</span>
        </Link>
      </div>
    </div>
  );
};

export default Login;
