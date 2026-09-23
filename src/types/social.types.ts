import { Profile, College } from './database.types';

export type FeedCategory = 'for-you' | 'following' | 'campus' | 'clubs' | 'trending';

export interface PostAuthor extends Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo' | 'course' | 'year' | 'branch'> {
  college?: Pick<College, 'id' | 'name'>;
}

export interface Post {
  id: string;
  author_id: string;
  author: PostAuthor;
  college_id: string;
  content: string;
  media_urls: string[];
  link_url?: string | null;
  link_title?: string | null;
  visibility: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Client state
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author: PostAuthor;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  author_id: string;
  author: PostAuthor;
  college_id: string;
  media_url: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user?: Profile;
}

export interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  group_avatar: string | null;
  group_type: 'direct' | 'club' | 'event' | 'project_team';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface MessageReaction {
  emoji: string;
  users: string[]; // user_ids
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: PostAuthor;
  content: string;
  media_urls?: string[];
  file_url?: string | null;
  file_name?: string | null;
  reply_to_id?: string | null;
  reply_to?: Message | null;
  reactions: Record<string, string[]>; // { '👍': ['user1', 'user2'] }
  created_at: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}
