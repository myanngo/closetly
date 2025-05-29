import React, { useState, useEffect } from "react";
import "./AddItem.css";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import clothesHanger from "../assets/clothesonhanger.png";
import Postcard from "./Postcard";

const AddItem = () => {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [itemType, setItemType] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [wear, setWear] = useState("");
  const [letgo, setLetgo] = useState([]);
  const [pictureFile, setPictureFile] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("");
  const [userItems, setUserItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [step, setStep] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

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

  // Fetch user's items for story mode
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!username) return;
      const { data, error } = await supabase
        .from("items")
        .select("id, title, brand, size")
        .eq("current_owner", username);
      if (!error && data) setUserItems(data);
    };

    if (mode === "story" && username) fetchUserItems();
  }, [username, mode]);

  // Handle URL parameters for different modes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemId = params.get("itemId");
    const modeParam = params.get("mode");

    if (modeParam === "story" && itemId) {
      // Story mode with pre-selected item
      setMode("story");
      setStep(1);
      setSelectedItemId(itemId);
    } else if (itemId && !modeParam) {
      // Legacy: existing story mode logic
      setMode("story");
      setStep(1);
      setSelectedItemId(itemId);
    }
  }, [location.search]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "story") {
        if (!selectedItemId) throw new Error("Please select an item");
        if (!story.trim()) throw new Error("Story is required");

        // Upload image if provided
        const imageUrl = await uploadImage();

        // Insert a new post for the existing item
        const { error: insertError } = await supabase.from("posts").insert({
          item_id: selectedItemId,
          story: story.trim(),
          picture: imageUrl,
          giver: username,
        });

        if (insertError)
          throw new Error("Failed to add story: " + insertError.message);

        navigate("/");
        return;
      }

      // Existing add new item logic
      if (!title.trim()) throw new Error("Title is required");
      if (!username)
        throw new Error(
          "User information not loaded. Please refresh and try again."
        );

      const imageUrl = await uploadImage();

      // First create the item entry
      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .insert({
          title: title.trim(),
          brand: brand.trim(),
          size: size.trim(),
          wear,
          current_owner: username,
          original_owner: username,
          letgo_method: letgo.map((l) => (l === "give-away" ? "giveaway" : l)),
        })
        .select()
        .single();

      if (itemError) {
        console.error("Error creating item:", itemError);
        throw new Error("Failed to create item: " + itemError.message);
      }

      // Then create the post with the item's id
      const { data: postData, error: insertError } = await supabase
        .from("posts")
        .insert({
          story: story.trim(),
          picture: imageUrl,
          giver: username,
          item_id: itemData.id,
          letgo_method: letgo.map((l) => (l === "give-away" ? "giveaway" : l)),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating post:", insertError);
        // If post creation fails, we should delete the item to maintain consistency
        await supabase.from("items").delete().eq("id", itemData.id);
        throw new Error("Failed to create post: " + insertError.message);
      }

      // Update the item with the latest post id
      const { error: updateError } = await supabase
        .from("items")
        .update({ latest_post_id: postData.id })
        .eq("id", itemData.id);

      if (updateError) {
        console.error("Error updating item:", updateError);
        // If update fails, we should clean up both the post and item
        await supabase.from("posts").delete().eq("id", postData.id);
        await supabase.from("items").delete().eq("id", itemData.id);
        throw new Error("Failed to update item: " + updateError.message);
      }

      console.log("Successfully created item and post:", itemData);
      navigate("/");
    } catch (err) {
      setError(err.message || "An error occurred while creating your post");
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = (isStory) => {
    if (isStory) {
      const item = userItems.find((i) => i.id === selectedItemId);
      return (
        <div className="add-preview">
          <div className="add-title">Preview your story</div>
          <Postcard
            user={`@${username}${item ? ` - ${item.title}` : ""}`}
            text={story}
            image={pictureFile ? URL.createObjectURL(pictureFile) : ""}
            initialLikes={0}
            hideActions={true}
            post_id={selectedItemId || 0}
          />
        </div>
      );
    } else {
      return (
        <div className="add-preview">
          <div className="add-title">Preview your item</div>
          <Postcard
            user={`@${username}`}
            text={story}
            image={pictureFile ? URL.createObjectURL(pictureFile) : ""}
            initialLikes={0}
            hideActions={true}
            post_id={0}
          />
          <div style={{ margin: "1.2rem 0", textAlign: "center" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Item Details</div>
            <div>
              <b>Brand:</b> {brand}
            </div>
            <div>
              <b>Size:</b> {size}
            </div>
            <div>
              <b>Wear:</b> {wear}
            </div>
          </div>
        </div>
      );
    }
  };

  // Initial selection screen
  if (step === 0) {
    return (
      <div className="add-bg">
        <div className="add-title">What would you like to add?</div>
        <img
          src={clothesHanger}
          alt="clothes on hanger"
          className="add-illustration"
        />
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            className="add-btn add-select-btn"
            style={{ fontSize: "1.2rem" }}
            onClick={() => {
              setMode("new");
              setStep(1);
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: 10 }} />
            Add a new item
          </button>
          <button
            className="add-btn add-select-btn"
            style={{ fontSize: "1.2rem", background: "#222", color: "#fff" }}
            onClick={() => {
              setMode("story");
              setStep(1);
            }}
          >
            <FontAwesomeIcon icon={faPen} style={{ marginRight: 10 }} />
            Add a story to an existing item
          </button>
        </div>
      </div>
    );
  }

  // Story mode flow
  if (mode === "story") {
    if (step === 1) {
      return (
        <div className="add-bg">
          <button
            className="add-back-btn"
            type="button"
            onClick={() => setStep(0)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add a Story to an Item</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <label className="subheader">Select Item</label>
            <select
              className="add-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              <option value="">Choose an item...</option>
              {userItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} {item.brand && `(${item.brand})`}{" "}
                  {item.size && `- Size ${item.size}`}
                </option>
              ))}
            </select>
            <label className="subheader">Story</label>
            <textarea
              className="add-textarea"
              placeholder="Tell us a bit more about this piece..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
            />
            <div className="picture-upload">
              <p>Upload a picture (optional)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPictureFile(e.target.files[0])}
              />
            </div>
            <button
              type="submit"
              className="add-btn"
              style={{ background: "#222", color: "#fff" }}
            >
              preview
            </button>
          </form>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="add-bg">
          <button
            className="add-back-btn"
            type="button"
            onClick={() => setStep(1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          {renderPreview(true)}
          <button
            className="add-btn"
            style={{ background: "#222", color: "#fff", marginTop: 24 }}
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const imageUrl = pictureFile ? await uploadImage() : null;
                const { error: insertError } = await supabase
                  .from("posts")
                  .insert({
                    item_id: selectedItemId,
                    story: story.trim(),
                    picture: imageUrl,
                    giver: username,
                  });
                if (insertError)
                  throw new Error(
                    "Failed to add story: " + insertError.message
                  );
                navigate("/");
              } catch (err) {
                setError(
                  err.message || "An error occurred while creating your post"
                );
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "posting..." : "post"}
          </button>
          {error && <div className="add-error">{error}</div>}
        </div>
      );
    }
  }

  // New item mode flow
  if (mode === "new") {
    if (step === 1) {
      return (
        <div className="add-bg">
          <button
            className="add-back-btn"
            type="button"
            onClick={() => setStep(0)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add an item</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <div className="picture-upload">
              <p>
                Upload a photo for your story here (e.g. an outfit with item)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPictureFile(e.target.files[0])}
              />
              {pictureFile && (
                <img
                  src={URL.createObjectURL(pictureFile)}
                  alt="preview"
                  className="big-image-preview"
                />
              )}
            </div>
            <label className="subheader">Title</label>
            <input
              className="add-input"
              placeholder="What is this? White skirt? Denim jeans?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <label className="subheader">Story</label>
            <textarea
              className="add-textarea"
              placeholder="Tell a story. What adventures have you been on with this item?"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
            />
            <button
              type="submit"
              className="add-btn"
              style={{ background: "#222", color: "#fff" }}
            >
              next
            </button>
          </form>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="add-bg">
          <button
            className="add-back-btn"
            type="button"
            onClick={() => setStep(1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add item details</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
          >
            <label className="subheader">Item Type</label>
            <select
              className="add-select"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="shoes">Shoes</option>
              <option value="accessory">Accessory</option>
            </select>
            <label className="subheader">Size</label>
            <input
              className="add-input"
              placeholder="Enter Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
            <label className="subheader">Brand</label>
            <input
              className="add-input"
              placeholder="Enter Brand Name"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <label className="subheader">Wear</label>
            <select
              className="add-select"
              value={wear}
              onChange={(e) => setWear(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            <label className="subheader">How do you want to let this go?</label>
            <div className="letgo-options">
              {["give-away", "lend", "swap"].map((option) => (
                <label
                  key={option}
                  className={`letgo-btn${
                    letgo.includes(option) ? " selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={letgo.includes(option)}
                    onChange={(e) => {
                      if (e.target.checked) setLetgo([...letgo, option]);
                      else setLetgo(letgo.filter((l) => l !== option));
                    }}
                    style={{ display: "none" }}
                  />
                  {option === "give-away"
                    ? "Give Away"
                    : option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="add-btn"
              style={{ background: "#222", color: "#fff" }}
            >
              preview
            </button>
          </form>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="add-bg">
          <button
            className="add-back-btn"
            type="button"
            onClick={() => setStep(2)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          {renderPreview(false)}
          <button
            className="add-btn"
            style={{ background: "#222", color: "#fff", marginTop: 24 }}
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const imageUrl = pictureFile ? await uploadImage() : null;

                // First create the item entry
                const { data: itemData, error: itemError } = await supabase
                  .from("items")
                  .insert({
                    title: title.trim(),
                    brand: brand.trim(),
                    size: size.trim(),
                    wear,
                    current_owner: username,
                    original_owner: username,
                    letgo_method: letgo.map((l) =>
                      l === "give-away" ? "giveaway" : l
                    ),
                  })
                  .select()
                  .single();

                if (itemError) {
                  console.error("Error creating item:", itemError);
                  throw new Error(
                    "Failed to create item: " + itemError.message
                  );
                }

                // Then create the post with the item's id
                const { data: postData, error: insertError } = await supabase
                  .from("posts")
                  .insert({
                    story: story.trim(),
                    picture: imageUrl,
                    giver: username,
                    item_id: itemData.id,
                    letgo_method: letgo.map((l) =>
                      l === "give-away" ? "giveaway" : l
                    ),
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error creating post:", insertError);
                  // If post creation fails, we should delete the item to maintain consistency
                  await supabase.from("items").delete().eq("id", itemData.id);
                  throw new Error(
                    "Failed to create post: " + insertError.message
                  );
                }

                // Update the item with the latest post id
                const { error: updateError } = await supabase
                  .from("items")
                  .update({ latest_post_id: postData.id })
                  .eq("id", itemData.id);

                if (updateError) {
                  console.error("Error updating item:", updateError);
                  // If update fails, we should clean up both the post and item
                  await supabase.from("posts").delete().eq("id", postData.id);
                  await supabase.from("items").delete().eq("id", itemData.id);
                  throw new Error(
                    "Failed to update item: " + updateError.message
                  );
                }

                console.log("Successfully created item and post:", itemData);
                navigate("/");
              } catch (err) {
                setError(
                  err.message || "An error occurred while creating your post"
                );
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "posting..." : "post"}
          </button>
          {error && <div className="add-error">{error}</div>}
        </div>
      );
    }
  }

  return null;
};

export default AddItem;
