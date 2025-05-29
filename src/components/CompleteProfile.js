import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

const CompleteProfile = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("User not authenticated");
      return;
    }

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: user.id,
        email: user.email,
        username: username,
        phone_number: phoneNumber,
        full_name: name,
        bio: bio,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Complete Your Profile
        </h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              First and/or Last Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium">
              Bio
            </label>
            <input
              id="bio"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
