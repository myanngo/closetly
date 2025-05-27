import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signUp({
        email,
        password,
      });
      if (error) throw error;
      navigate("/verify");
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
          <div className="login-tagline">Swap, lend, and share your closet!</div>
        </div>
        <h2 className="login-header">Create your account</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">{error}</div>
          )}
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
              autoComplete="new-password"
              required
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">
            Sign up
          </button>
          <div className="login-signup-link">
            Already have an account? <a href="/login">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
