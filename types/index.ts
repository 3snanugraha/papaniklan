// Media item type definition
export interface Media {
  id: number;
  title: string;
  uri: string;
  type: "video" | "image";
  thumbnail?: string;
  duration?: number;
  created_at?: number;
  order_index?: number;
}

export type Video = Media;
