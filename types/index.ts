// Video type definition
export interface Video {
  id: number;
  title: string;
  uri: string;
  thumbnail?: string;
  duration?: number;
  created_at?: number;
  order_index?: number;
}
