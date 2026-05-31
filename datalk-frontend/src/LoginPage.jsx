import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const AUTH_SERVICE_URL = "http://localhost:8002";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegister ? "/register" : "/login";
      const fullUrl = `${AUTH_SERVICE_URL}${endpoint}`;
      let options;
      
      console.log(`🚀 [START] Attempting ${isRegister ? 'Registration' : 'Login'} at ${fullUrl}`);

      if (isRegister) {
        // EXACT JSON payload for FastAPI's Pydantic model
        options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        };
        console.log("📦 [PAYLOAD] Sending JSON:", options.body);
      } else {
        // EXACT Form Data payload for FastAPI's OAuth2 model
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        
        options = {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        };
        console.log("📦 [PAYLOAD] Sending Form Data:", formData.toString());
      }
      
      const response = await fetch(fullUrl, options);
      console.log(`📥 [RESPONSE] Status Code: ${response.status}`);

      const data = await response.json();
      console.log("📥 [RESPONSE] Data:", data);

      if (!response.ok) {
        // If the backend throws a 400, 401, or 422, we catch it here
        throw new Error(data.detail || `Server returned ${response.status}`);
      }

      // Success! We got the token.
      console.log("✅ [SUCCESS] Token acquired! Saving to localStorage.");
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("username", username);

      // Route them into the app
      navigate("/dashboard");

    } catch (err) {
      console.error("❌ [ERROR] Caught in catch block:", err.message);
      setError(err.message || "Something went wrong communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#000000", fontFamily: "sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "24px" }}>
        
        <h1 style={{ color: "#fff", textAlign: "center", marginBottom: "30px" }}>datalk auth test</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#fff", display: "block", marginBottom: "8px" }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#222", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#fff", display: "block", marginBottom: "8px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#222", color: "#fff", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "#ff6b6b", marginBottom: "20px", padding: "10px", border: "1px solid #ff6b6b", borderRadius: "5px" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", backgroundColor: "#10b981", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? "Processing..." : (isRegister ? "Register" : "Login")}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", textDecoration: "underline" }}
          >
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
        </div>

      </div>
    </div>
  );
}