import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Post, FeedCategory } from '@/types/social.types';
import { rankPosts, RankingContext } from '@/lib/ranking';

const PAGE_SIZE = 10;
const STORAGE_KEY = 'campusgram_posts_store';

// Default initial campus posts to ensure lively feed even on fresh run
const SEED_POSTS: Post[] = [
  {
    id: 'post-seed-01',
    author_id: 'usr-ashu-devops-01',
    author: {
      id: 'usr-ashu-devops-01',
      full_name: 'Ashu DevOps',
      username: 'ashu.devops',
      profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      course: 'B.Tech Computer Science',
      year: 'Final Year',
      branch: 'DevOps & Systems Engineering',
    },
    college_id: 'col-iitb',
    content: '🚀 Welcome to CampusGram! We just automated our campus microservices deployment pipeline using Kubernetes and ArgoCD. Drop a comment if you want a workshop on Cloud-Native DevOps & CI/CD this weekend!',
    media_urls: [
      'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
    ],
    link_url: 'https://github.com/campusgram/cloud-native-devops',
    link_title: 'Campus DevOps Architecture Docs',
    visibility: 'campus',
    likes_count: 38,
    comments_count: 14,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_liked: false,
    is_saved: false,
  },
  {
    id: 'post-seed-02',
    author_id: 'usr-priya-sharma',
    author: {
      id: 'usr-priya-sharma',
      full_name: 'Priya Sharma',
      username: 'priya.ai',
      profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      course: 'M.Tech Artificial Intelligence',
      year: '1st Year',
      branch: 'Data Science',
    },
    college_id: 'col-iitb',
    content: 'Just uploaded our complete Neural Networks & Transformer architectures notes in the Campus Notes Vault. Includes hand-annotated backprop equations and PyTorch code snippets for mid-terms! 📚✨',
    media_urls: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    ],
    link_url: '/campus/notes',
    link_title: 'View Neural Networks Study Vault',
    visibility: 'campus',
    likes_count: 56,
    comments_count: 19,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_liked: true,
    is_saved: true,
  },
  {
    id: 'post-seed-03',
    author_id: 'usr-robotics-lead',
    author: {
      id: 'usr-robotics-lead',
      full_name: 'Robotics & Automation Society',
      username: 'robotics.iitb',
      profile_photo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
      course: 'Official Club',
      year: 'Campus Chapter',
      branch: 'Mechatronics & Embedded Systems',
    },
    college_id: 'col-iitb',
    content: '🤖 Announcing our Annual Autonomous Rover Challenge! 15 campus teams will compete this Friday at the Central Oval. Check-in via QR code at the entrance to record your attendance certificate.',
    media_urls: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    ],
    link_url: '/campus/events',
    link_title: 'RSVP to Autonomous Rover Challenge',
    visibility: 'campus',
    likes_count: 82,
    comments_count: 27,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    is_liked: false,
    is_saved: false,
  },
];

function getStoredPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_POSTS;
  } catch {
    return SEED_POSTS;
  }
}

function saveStoredPosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to persist posts to localStorage:', e);
  }
}

export async function fetchFeedPosts(
  category: FeedCategory,
  page: number = 0,
  context?: RankingContext
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  // If Supabase is configured and reachable, attempt DB fetch
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, full_name, username, profile_photo, course, year, branch
          )
        `);

      if (category === 'campus' && context?.collegeId) {
        query = query.eq('college_id', context.collegeId);
      } else if (category === 'following' && context?.followingUserIds) {
        const followingIds = Array.from(context.followingUserIds);
        if (followingIds.length === 0) {
          return { posts: [], hasMore: false };
        }
        query = query.in('author_id', followingIds);
      } else if (category === 'trending') {
        query = query.order('likes_count', { ascending: false });
      }

      query = query.order('created_at', { ascending: false }).range(from, to - 1);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let formattedPosts: Post[] = data.map((raw: any) => ({
          id: raw.id,
          author_id: raw.author_id,
          author: raw.author,
          college_id: raw.college_id,
          content: raw.content,
          media_urls: raw.media_urls || [],
          link_url: raw.link_url,
          link_title: raw.link_title,
          visibility: raw.visibility || 'campus',
          likes_count: raw.likes_count || 0,
          comments_count: raw.comments_count || 0,
          created_at: raw.created_at,
          updated_at: raw.updated_at,
          is_liked: false,
          is_saved: false,
        }));

        if (category === 'for-you' && context) {
          formattedPosts = rankPosts(formattedPosts, context);
        }

        return {
          posts: formattedPosts,
          hasMore: data.length === PAGE_SIZE,
        };
      }
    } catch (err) {
      console.warn('Supabase feed load fallback to local store:', err);
    }
  }

  // Local / Fallback store
  const allPosts = getStoredPosts();
  let filtered = [...allPosts];

  if (category === 'trending') {
    filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
  } else if (category === 'clubs') {
    filtered = filtered.filter(
      (p) =>
        p.author.course?.toLowerCase().includes('club') ||
        p.author.username?.toLowerCase().includes('club') ||
        p.content.toLowerCase().includes('club') ||
        p.content.toLowerCase().includes('society')
    );
  } else if (category === 'following' && context?.followingUserIds) {
    if (context.followingUserIds.size > 0) {
      filtered = filtered.filter((p) => context.followingUserIds?.has(p.author_id));
    }
  }

  if (category === 'for-you' && context) {
    filtered = rankPosts(filtered, context);
  }

  const paged = filtered.slice(from, to);
  return {
    posts: paged,
    hasMore: to < filtered.length,
  };
}

export async function createPost(params: {
  authorId: string;
  collegeId: string;
  content: string;
  mediaUrls?: string[];
  linkUrl?: string;
  linkTitle?: string;
  authorProfile?: any;
}): Promise<{ post?: Post; error?: any }> {
  const currentPosts = getStoredPosts();

  // Author details from active session or fallback
  const authorData = params.authorProfile || {
    id: params.authorId,
    full_name: 'Ashu DevOps',
    username: 'ashu.devops',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    course: 'B.Tech Computer Science',
    year: 'Final Year',
    branch: 'DevOps & Systems',
  };

  const newPost: Post = {
    id: `post-${Date.now()}`,
    author_id: params.authorId || authorData.id,
    author: authorData,
    college_id: params.collegeId || 'col-iitb',
    content: params.content,
    media_urls: params.mediaUrls || [],
    link_url: params.linkUrl || null,
    link_title: params.linkTitle || null,
    visibility: 'campus',
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_liked: false,
    is_saved: false,
  };

  // Prepend to local persistent storage
  const updatedPosts = [newPost, ...currentPosts];
  saveStoredPosts(updatedPosts);

  // Background sync with Supabase if configured
  if (isSupabaseConfigured) {
    void (async () => {
      try {
        const { error } = await supabase
          .from('posts')
          .insert({
            author_id: params.authorId,
            college_id: params.collegeId,
            content: params.content,
            media_urls: params.mediaUrls || [],
            link_url: params.linkUrl || null,
            link_title: params.linkTitle || null,
            visibility: 'campus',
          });
        if (error) console.warn('Supabase background insert note:', error);
      } catch (e) {
        console.warn('Supabase background insert note:', e);
      }
    })();
  }

  return { post: newPost };
}

export async function toggleLikePost(
  postId: string,
  _userId: string,
  currentlyLiked: boolean
): Promise<{ success: boolean; newLiked: boolean; error?: any }> {
  const posts = getStoredPosts();
  const target = posts.find((p) => p.id === postId);
  if (target) {
    target.is_liked = !currentlyLiked;
    target.likes_count = Math.max(0, (target.likes_count || 0) + (!currentlyLiked ? 1 : -1));
    saveStoredPosts(posts);
  }
  return { success: true, newLiked: !currentlyLiked };
}

export async function toggleSavePost(
  postId: string,
  _userId: string,
  currentlySaved: boolean
): Promise<{ success: boolean; newSaved: boolean }> {
  const posts = getStoredPosts();
  const target = posts.find((p) => p.id === postId);
  if (target) {
    target.is_saved = !currentlySaved;
    saveStoredPosts(posts);
  }
  return { success: true, newSaved: !currentlySaved };
}

export async function deletePost(postId: string): Promise<{ success: boolean; error?: any }> {
  const posts = getStoredPosts();
  const filtered = posts.filter((p) => p.id !== postId);
  saveStoredPosts(filtered);
  return { success: true };
}
