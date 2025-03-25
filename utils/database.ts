import * as SQLite from "expo-sqlite";
import { Video } from "../types";

// Database name
const DB_NAME = "videoplayer.db";

// Open or create the database
const db = SQLite.openDatabaseSync(DB_NAME);

// Database initialization function
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create videos table if it doesn't exist
      db.execSync(
        `CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          uri TEXT NOT NULL,
          thumbnail TEXT,
          duration REAL,
          created_at INTEGER,
          order_index INTEGER
        )`
      );
      console.log("Database initialized successfully");
      resolve();
    } catch (error) {
      console.error("Error initializing database:", error);
      reject(error);
    }
  });
};

// Get all videos from the database
export const getVideos = async (): Promise<Video[]> => {
  try {
    const result = db.getAllSync<Video>(
      "SELECT * FROM videos ORDER BY created_at DESC"
    );
    return result;
  } catch (error) {
    console.error("Error getting videos:", error);
    throw error;
  }
};

// Add a new video to the database
export const addVideo = async (video: Partial<Video>): Promise<number> => {
  try {
    const result = db.runSync(
      `INSERT INTO videos (title, uri, thumbnail, duration, created_at, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        video.title || "",
        video.uri || "",
        video.thumbnail || null,
        video.duration || null,
        video.created_at || Date.now(),
        video.order_index || null,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding video:", error);
    throw error;
  }
};

// Update an existing video in the database
export const updateVideo = async (
  id: number,
  data: Partial<Video>
): Promise<boolean> => {
  try {
    // Build the SET part of the SQL query dynamically based on provided data
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.uri !== undefined) {
      updates.push("uri = ?");
      values.push(data.uri);
    }
    if (data.thumbnail !== undefined) {
      updates.push("thumbnail = ?");
      values.push(data.thumbnail);
    }
    if (data.duration !== undefined) {
      updates.push("duration = ?");
      values.push(data.duration);
    }
    if (data.created_at !== undefined) {
      updates.push("created_at = ?");
      values.push(data.created_at);
    }
    if (data.order_index !== undefined) {
      updates.push("order_index = ?");
      values.push(data.order_index);
    }

    // Add the ID to the values array
    values.push(id);

    // Execute the update query
    const result = db.runSync(
      `UPDATE videos SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  } catch (error) {
    console.error("Error updating video:", error);
    throw error;
  }
};

// Delete a video from the database
export const deleteVideo = async (id: number): Promise<boolean> => {
  try {
    const result = db.runSync("DELETE FROM videos WHERE id = ?", [id]);
    return result.changes > 0;
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error;
  }
};

// Get a single video by ID
export const getVideoById = async (id: number): Promise<Video | null> => {
  try {
    const result = db.getFirstSync<Video | null>(
      "SELECT * FROM videos WHERE id = ?",
      [id]
    );
    return result;
  } catch (error) {
    console.error("Error getting video by ID:", error);
    throw error;
  }
};

// Update the order of videos
export const updateVideoOrder = async (
  videoIds: number[]
): Promise<boolean> => {
  try {
    // Start a transaction
    db.execSync("BEGIN TRANSACTION");

    // Update each video's order_index
    for (let index = 0; index < videoIds.length; index++) {
      const id = videoIds[index];
      db.runSync("UPDATE videos SET order_index = ? WHERE id = ?", [index, id]);
    }

    // Commit the transaction
    db.execSync("COMMIT");
    return true;
  } catch (error) {
    // Rollback on error
    try {
      db.execSync("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Error updating video order:", error);
    throw error;
  }
};

// Get videos ordered by order_index
export const getOrderedVideos = async (): Promise<Video[]> => {
  try {
    const result = db.getAllSync<Video>(
      "SELECT * FROM videos ORDER BY order_index ASC"
    );
    return result;
  } catch (error) {
    console.error("Error getting ordered videos:", error);
    throw error;
  }
};

export default {
  initDatabase,
  getVideos,
  addVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
  updateVideoOrder,
  getOrderedVideos,
};
