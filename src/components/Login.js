import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src={logo} alt="Closetly logo" className="login-logo" />
          <div className="login-title">Closetly</div>
          <div className="login-tagline">Swap, lend, and share your closet</div>
        </div>
        <h2 className="login-header">Sign in to your account</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="login-input-group">
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="login-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-input-group">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">
            Sign in
          </button>
          <div className="login-signup-link">
            Not signed up? <a href="/signup">Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
