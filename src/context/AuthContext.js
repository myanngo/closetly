import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchUserAndUsername(session) {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("username")
          .eq("id", session.user.id)
          .single();
        if (isMounted) setUsername(data?.username || "");
      } else {
        if (isMounted) setUsername("");
      }
      if (isMounted) setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndUsername(session);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 