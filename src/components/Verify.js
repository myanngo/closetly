import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

const Verify = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/complete-profile");
      }
    };

    const interval = setInterval(checkSession, 2000); // Check every 2s
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <p className="text-gray-700">
          We've sent you a confirmation link. Please click the link in your
          email to verify your account.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Once verified, you'll be redirected here automatically.
        </p>
      </div>
    </div>
  );
};

export default Verify;
