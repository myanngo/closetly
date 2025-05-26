import React, { useState, useEffect } from "react";
import "./AddItem.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

const AddItem = () => {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [itemType, setItemType] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [wear, setWear] = useState("");
  const [letgo, setLetgo] = useState("");
  const [pictureFile, setPictureFile] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to post items");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching username:", error);
          setError("Error loading user data");
          return;
        }

        if (data) setUsername(data.username);
      } catch (err) {
        console.error("Error in fetchUser:", err);
        setError("Failed to load user information");
      }
    };
    fetchUser();
  }, []);

  const uploadImage = async () => {
    if (!pictureFile) return null;

    try {
      const fileExt = pictureFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, pictureFile);

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error("Failed to upload image");
      }

      const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
      return data?.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  const getNextPostId = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("post_id")
        .order("post_id", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error getting next post ID:", error);
        throw error;
      }

      if (data.length === 0) return 1;
      return data[0].post_id + 1;
    } catch (err) {
      console.error("Error in getNextPostId:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic validation
      if (!title.trim()) {
        throw new Error("Title is required");
      }

      if (!username) {
        throw new Error(
          "User information not loaded. Please refresh and try again."
        );
      }

      // Upload image and get next post ID
      const [imageUrl, post_id] = await Promise.all([
        uploadImage(),
        getNextPostId(),
      ]);

      // Insert the post - make sure to include all fields that you're collecting
      const { error: insertError } = await supabase.from("posts").insert({
        title: title.trim(),
        story: story.trim(),
        brand: brand.trim(),
        size: size.trim(),
        wear,
        giver: username,
        picture: imageUrl,
        post_id,
        letgo_method: letgo,
      });

      if (insertError) {
        console.error("Error inserting post:", insertError);
        throw new Error("Failed to create post: " + insertError.message);
      }

      // Success - navigate back
      navigate("/");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "An error occurred while creating your post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-page">
      <h2>Add a Story or Item</h2>

      {error && (
        <div
          style={{
            color: "red",
            background: "#ffebee",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <div className="picture-upload">
        <p>Upload a picture here (ex. an outfit with item)</p>
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPictureFile(e.target.files[0])}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <label className="subheader">Title *</label>
        <textarea
          className="input-box-small"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className="subheader">Story</label>
        <textarea
          className="input-box"
          placeholder="Tell us a bit more about this piece..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />

        <label className="subheader">
          Item Type
          <select
            className="dropdown"
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
          >
            <option value="">Select</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="shoes">Shoes</option>
            <option value="accessory">Accessory</option>
          </select>
        </label>

        <label className="subheader">
          Size
          <input
            className="dropdown"
            placeholder="Enter Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </label>

        <label className="subheader">
          Brand
          <input
            className="dropdown"
            placeholder="Enter Brand Name"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </label>

        <label className="subheader">
          Wear
          <select
            className="dropdown"
            value={wear}
            onChange={(e) => setWear(e.target.value)}
          >
            <option value="">Select</option>
            <option value="excellent">Excellent</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </label>

        <label className="subheader">
          How do you want to let this go?
          <select
            className="dropdown"
            value={letgo}
            onChange={(e) => setLetgo(e.target.value)}
          >
            <option value="">Select</option>
            <option value="give-away">Give Away</option>
            <option value="swap">Swap</option>
          </select>
        </label>

        <button type="submit" className="post-button" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default AddItem;
