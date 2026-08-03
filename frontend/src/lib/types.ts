export interface PublicUser {
  id: number;
  username: string;
  name: string;
  profile_photo_url: string;
}

export interface Me extends PublicUser {
  email: string;
}

export interface Post {
  id: number;
  author: PublicUser;
  text: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: number;
  author: PublicUser;
  post: number;
  text: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
