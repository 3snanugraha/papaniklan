import * as SQLite from "expo-sqlite";
import { SQLiteDatabase } from "expo-sqlite";
import { Video } from "../types";

// Database name
const DB_NAME = "videoplayer.db";

// Open or create the database
const db: SQLiteDatabase = SQLite.openDatabaseSync(DB_NAME);

// Types for SQLite transactions
type SQLTransactionCallback = (transaction: SQLite.SQLTransaction) => void;
type SQLTransactionErrorCallback = (error: SQLite.SQLError) => void;
type SQLResultSetRowList = {
  length: number;
  item: (index: number) => any;
};
type SQLResultSet = {
  rowsAffected: number;
  insertId?: number;
  rows: SQLResultSetRowList;
};
type SQLStatementCallback = (
  transaction: SQLite.SQLTransaction,
  resultSet: SQLResultSet
) => void;
type SQLStatementErrorCallback = (
  transaction: SQLite.SQLTransaction,
  error: SQLite.SQLError
) => boolean;

// Database initialization function
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        // Create videos table if it doesn't exist
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            uri TEXT NOT NULL,
            thumbnail TEXT,
            duration REAL,
            created_at INTEGER,
            order_index INTEGER
          )`,
          [],
          () => {
            console.log("Database initialized successfully");
            resolve();
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error initializing database:", error);
        reject(error);
      }
    );
  });
};

// Get all videos from the database
export const getVideos = async (): Promise<Video[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          "SELECT * FROM videos ORDER BY created_at DESC",
          [],
          (_: SQLite.SQLTransaction, { rows }: SQLResultSet) => {
            const videos: Video[] = [];
            for (let i = 0; i < rows.length; i++) {
              videos.push(rows.item(i) as Video);
            }
            resolve(videos);
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error getting videos:", error);
        reject(error);
      }
    );
  });
};

// Add a new video to the database
export const addVideo = async (video: Partial<Video>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          `INSERT INTO videos (title, uri, thumbnail, duration, created_at, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            video.title || "",
            video.uri || "",
            video.thumbnail || null,
            video.duration || null,
            video.created_at || Date.now(),
            video.order_index || null,
          ],
          (_: SQLite.SQLTransaction, { insertId }: SQLResultSet) => {
            resolve(insertId || 0);
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error adding video:", error);
        reject(error);
      }
    );
  });
};

// Update an existing video in the database
export const updateVideo = async (
  id: number,
  data: Partial<Video>
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
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
        tx.executeSql(
          `UPDATE videos SET ${updates.join(", ")} WHERE id = ?`,
          values,
          (_: SQLite.SQLTransaction, { rowsAffected }: SQLResultSet) => {
            resolve(rowsAffected > 0);
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error updating video:", error);
        reject(error);
      }
    );
  });
};

// Delete a video from the database
export const deleteVideo = async (id: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          "DELETE FROM videos WHERE id = ?",
          [id],
          (_: SQLite.SQLTransaction, { rowsAffected }: SQLResultSet) => {
            resolve(rowsAffected > 0);
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error deleting video:", error);
        reject(error);
      }
    );
  });
};

// Get a single video by ID
export const getVideoById = async (id: number): Promise<Video | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          "SELECT * FROM videos WHERE id = ?",
          [id],
          (_: SQLite.SQLTransaction, { rows }: SQLResultSet) => {
            if (rows.length > 0) {
              resolve(rows.item(0) as Video);
            } else {
              resolve(null);
            }
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error getting video by ID:", error);
        reject(error);
      }
    );
  });
};

// Update the order of videos
export const updateVideoOrder = async (
  videoIds: number[]
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        let success = true;

        // Update each video's order_index
        videoIds.forEach((id, index) => {
          tx.executeSql(
            "UPDATE videos SET order_index = ? WHERE id = ?",
            [index, id],
            undefined,
            (_: SQLite.SQLTransaction, error: SQLite.SQLError) => {
              console.error("Error updating video order:", error);
              success = false;
              return false; // Roll back the transaction
            }
          );
        });

        resolve(success);
      },
      (error: SQLite.SQLError) => {
        console.error("Transaction error updating video order:", error);
        reject(error);
      }
    );
  });
};

// Get videos ordered by order_index
export const getOrderedVideos = async (): Promise<Video[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          "SELECT * FROM videos ORDER BY order_index ASC",
          [],
          (_: SQLite.SQLTransaction, { rows }: SQLResultSet) => {
            const videos: Video[] = [];
            for (let i = 0; i < rows.length; i++) {
              videos.push(rows.item(i) as Video);
            }
            resolve(videos);
          }
        );
      },
      (error: SQLite.SQLError) => {
        console.error("Error getting ordered videos:", error);
        reject(error);
      }
    );
  });
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
