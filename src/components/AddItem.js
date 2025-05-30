import React, { useState, useEffect } from "react";
import "./AddItem.css";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import clothesHanger from "../assets/clothesonhanger.png";
import Postcard from "./Postcard";

// Event tracking helper
const trackEvent = (category, action, label = null, value = null) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      non_interaction: false
    });
  }
};

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
  const [offerId, setOfferId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        trackEvent('AddItem', 'Page_Load', 'Add item page loaded');
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          trackEvent('AddItem', 'Auth_Error', 'User not logged in');
          setError("You must be logged in to post items");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) {
          trackEvent('AddItem', 'User_Data_Error', `Error fetching username: ${error.message}`);
          console.error("Error fetching username:", error);
          setError("Error loading user data");
          return;
        }

        if (data) {
          setUsername(data.username);
          trackEvent('AddItem', 'User_Data_Loaded', `Loaded data for user ${data.username}`);
        }
      } catch (err) {
        trackEvent('AddItem', 'Unexpected_Error', `Error in fetchUser: ${err.message}`);
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
    const offerIdParam = params.get("offerId");

    if (offerIdParam) {
      setOfferId(offerIdParam);
    }

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

  // Update offer status when post is created
  const updateOfferStatus = async () => {
    if (!offerId) return;

    try {
      const { error } = await supabase
        .from("offers")
        .update({ post_created: true })
        .eq("id", offerId);

      if (error) {
        console.error("Error updating offer status:", error);
      } else {
        console.log("Offer marked as complete:", offerId);
      }
    } catch (err) {
      console.error("Error in updateOfferStatus:", err);
    }
  };

  // Track mode selection
  const handleModeSelect = (selectedMode) => {
    trackEvent('AddItem', 'Mode_Select', `Selected ${selectedMode} mode`);
    setMode(selectedMode);
    setStep(1);
  };

  // Track item selection in story mode
  const handleItemSelect = (itemId) => {
    const selectedItem = userItems.find(item => item.id === itemId);
    trackEvent('AddItem', 'Item_Select', `Selected item ${itemId} (${selectedItem?.title || 'Unknown'})`);
    setSelectedItemId(itemId);
  };

  // Track image upload
  const handleImageUpload = (file) => {
    trackEvent('AddItem', 'Image_Upload', `Uploaded image: ${file.name}`);
    setPictureFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    trackEvent('AddItem', 'Submit_Initiated', `Started submitting ${mode} item`);

    try {
      if (mode === "story") {
        if (!selectedItemId) throw new Error("Please select an item");
        if (!story.trim()) throw new Error("Story is required");

        trackEvent('AddItem', 'Story_Submit', `Submitting story for item ${selectedItemId}`);

        // Upload image if provided
        const imageUrl = await uploadImage();
        if (imageUrl) {
          trackEvent('AddItem', 'Image_Upload_Success', `Successfully uploaded image for item ${selectedItemId}`);
        }

        // Fetch previous_owner, current_owner, and original_owner
        const { data: itemData, error: itemFetchError } = await supabase
          .from("items")
          .select("previous_owner, current_owner, original_owner")
          .eq("id", selectedItemId)
          .single();

        if (itemFetchError || !itemData) {
          throw new Error("Could not fetch owner info for this item.");
        }

        let giver, receiver;
        if (itemData.original_owner === username) {
          // Scenario 1: original owner
          giver = username;
          receiver = null;
        } else {
          // Scenario 2: received from someone else
          // Use original_owner if previous_owner is null/undefined or same as current user
          const actualGiver =
            itemData.previous_owner && itemData.previous_owner !== username
              ? itemData.previous_owner
              : itemData.original_owner;

          giver = actualGiver;
          receiver = username;
        }

        const { error: insertError } = await supabase.from("posts").insert({
          item_id: selectedItemId,
          story: story.trim(),
          picture: imageUrl,
          giver,
          receiver,
        });

        if (insertError)
          throw new Error("Failed to add story: " + insertError.message);

        // If this post was created from an offer, update the offer status
        await updateOfferStatus();

        trackEvent('AddItem', 'Story_Success', `Successfully added story for item ${selectedItemId}`);
        navigate("/");
        return;
      }

      // Existing add new item logic
      if (!title.trim()) throw new Error("Title is required");
      if (!username)
        throw new Error(
          "User information not loaded. Please refresh and try again."
        );

      // Upload image if provided
      const imageUrl = await uploadImage();
      if (imageUrl) {
        trackEvent('AddItem', 'Image_Upload_Success', 'Successfully uploaded image for new item');
      }

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

      // If this post was created from an offer, update the offer status
      await updateOfferStatus();

      console.log("Successfully created item and post:", itemData);
      trackEvent('AddItem', 'NewItem_Success', `Successfully created new item: ${title}`);
      navigate("/");
    } catch (err) {
      trackEvent('AddItem', 'Submit_Error', `Error submitting ${mode} item: ${err.message}`);
      setError(err.message || "An error occurred while creating your post");
    } finally {
      setLoading(false);
    }
  };

  // Track step navigation
  const handleStepChange = (newStep) => {
    trackEvent('AddItem', 'Step_Change', `Changed from step ${step} to ${newStep}`);
    setStep(newStep);
  };

  // Track form field changes
  const handleFieldChange = (field, value) => {
    trackEvent('AddItem', 'Field_Change', `Changed ${field} field`);
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'story':
        setStory(value);
        break;
      case 'itemType':
        setItemType(value);
        break;
      case 'size':
        setSize(value);
        break;
      case 'brand':
        setBrand(value);
        break;
      case 'wear':
        setWear(value);
        break;
      default:
        break;
    }
  };

  const renderPreview = (isStory) => {
    if (isStory) {
      const item = userItems.find((i) => i.id === selectedItemId);
      return (
        <div className="add-preview">
          <div className="add-title">Preview your story</div>
          <div
            style={{
              color: "#b85c5c",
              fontFamily: "Manrope",
              fontSize: "1rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#222" }}>@{username}</span>
            <span style={{ color: "#d36c6c", fontWeight: 600, marginLeft: 18 }}>
              {item ? item.title : ""} {item && item.brand && `(${item.brand})`}{" "}
              {item && item.size && `- Size ${item.size}`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Postcard
              user={(() => {
                // For preview, receiver is always the current user
                return `@${username}`;
              })()}
              text={story}
              image={pictureFile ? URL.createObjectURL(pictureFile) : ""}
              initialLikes={0}
              hideActions={true}
              post_id={selectedItemId || 0}
              id={"preview"}
              created_at={new Date().toISOString()}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="add-preview">
          <div className="add-title">Preview your item</div>
          <div
            style={{
              color: "#b85c5c",
              fontFamily: "Manrope",
              fontSize: "1rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#222" }}>@{username}</span>
            <span style={{ color: "#d36c6c", fontWeight: 600, marginLeft: 18 }}>
              {title} {brand && `(${brand})`} {size && `- Size ${size}`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Postcard
              user={(() => {
                // For preview, receiver is always the current user
                return `@${username}`;
              })()}
              text={story}
              image={pictureFile ? URL.createObjectURL(pictureFile) : ""}
              initialLikes={0}
              hideActions={true}
              post_id={0}
              id={"preview"}
              created_at={new Date().toISOString()}
            />
          </div>
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
        <div className="add-title">
          . ݁˖ . What story do you want to tell? . ݁₊ ⊹ ݁{" "}
        </div>
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
            style={{ fontSize: "1rem" }}
            onClick={() => handleModeSelect("new")}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: 10 }} />
            Add a new item
          </button>
          <button
            className="add-btn add-select-btn"
            style={{ fontSize: "1rem", background: "#222", color: "#fff" }}
            onClick={() => handleModeSelect("story")}
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
            onClick={() => handleStepChange(0)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add a Story to an Item</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleStepChange(2);
            }}
          >
            <label className="subheader">Select Item</label>
            <select
              className="add-select"
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              required
              disabled={selectedItemId && offerId} // Disable if item is pre-selected from an offer
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
              onChange={(e) => handleFieldChange('story', e.target.value)}
              required
            />
            <div className="picture-upload">
              <p>Upload a picture (optional)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
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
            onClick={() => handleStepChange(1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          {renderPreview(true)}
          <button
            className="add-btn"
            style={{ background: "#222", color: "#fff", marginTop: 24 }}
            onClick={handleSubmit}
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
            onClick={() => handleStepChange(0)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add an item</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleStepChange(2);
            }}
          >
            <div className="picture-upload">
              <p>
                Upload a photo for your story here
                <br></br>(e.g. an outfit with item)
              </p>
              <label className="custom-file-upload">
                Choose a file
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                />
              </label>
              {pictureFile && (
                <img
                  src={URL.createObjectURL(pictureFile) || "/placeholder.svg"}
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
              onChange={(e) => handleFieldChange('title', e.target.value)}
              required
            />
            <label className="subheader">Story</label>
            <textarea
              className="add-textarea"
              placeholder="Tell a story. What adventures have you been on with this item?"
              value={story}
              onChange={(e) => handleFieldChange('story', e.target.value)}
              required
            />
            <button
              type="submit"
              className="add-btn"
              style={{
                background: "#222",
                color: "#fff",
                width: "40%",
                alignSelf: "center",
              }}
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
            onClick={() => handleStepChange(1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="add-title">Add item details</div>
          {error && <div className="add-error">{error}</div>}
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleStepChange(3);
            }}
          >
            <label className="subheader">Item Type</label>
            <select
              className="add-select"
              value={itemType}
              onChange={(e) => handleFieldChange('itemType', e.target.value)}
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
              onChange={(e) => handleFieldChange('size', e.target.value)}
              required
            />
            <label className="subheader">Brand</label>
            <input
              className="add-input"
              placeholder="Enter Brand Name"
              value={brand}
              onChange={(e) => handleFieldChange('brand', e.target.value)}
              required
            />
            <label className="subheader">Wear</label>
            <select
              className="add-select"
              value={wear}
              onChange={(e) => handleFieldChange('wear', e.target.value)}
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
              style={{
                background: "#222",
                color: "#fff",
                width: "40%",
                alignSelf: "center",
              }}
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
            onClick={() => handleStepChange(2)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          {renderPreview(false)}
          <button
            className="add-btn"
            style={{
              background: "#222",
              color: "#fff",
              marginTop: 24,
              width: "20%",
              alignSelf: "center",
            }}
            onClick={handleSubmit}
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
