import React, { createContext, useContext, useState } from "react";
import { postsData as initialPosts } from "../../data/postsDummyData";

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState(initialPosts);

  const addPost = (post) => {
    setPosts((prev) => [
      { ...post, id: Date.now() }, // simple unique id
      ...prev,
    ]);
  };

  return (
    <PostsContext.Provider value={{ posts, addPost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
} 