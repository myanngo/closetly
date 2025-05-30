import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserAndUsername(session) {
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data, error } = await supabase
            .from("users")
            .select("username")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error fetching username:", error);
          }

          if (isMounted) setUsername(data?.username || "");
        } else {
          if (isMounted) setUsername("");
        }
      } catch (err) {
        console.error("Auth error:", err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Add error handling for getSession
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Session error:", error);
          setError(error);
          setLoading(false);
          return;
        }
        fetchUserAndUsername(session);
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
        setError(err);
        setLoading(false);
      });

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchUserAndUsername(session);
      }
    );

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    username,
    error,
  };

  // Show error state
  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h3>Configuration Error</h3>
        <p>Check console for details</p>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
