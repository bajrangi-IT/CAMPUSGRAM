import { Post } from '@/types/social.types';

export interface RankingContext {
  currentUserId: string;
  collegeId?: string | null;
  followingUserIds: Set<string>;
  userInterests: Set<string>;
  userBranch?: string | null;
}

/**
 * Computes a relevance score for a post to order the 'For You' and 'Trending' feeds.
 * Higher score appears earlier in the feed.
 */
export function rankPosts(posts: Post[], context: RankingContext): Post[] {
  const now = Date.now();

  const scored = posts.map((post) => {
    let score = 0;

    // 1. Followed users boost (+40 points)
    if (context.followingUserIds.has(post.author_id)) {
      score += 40;
    }

    // 2. Campus Relevance (+20 points if same college)
    if (context.collegeId && post.college_id === context.collegeId) {
      score += 20;
    }

    // 3. Department / Branch alignment (+15 points)
    if (
      context.userBranch &&
      post.author.branch &&
      post.author.branch.toLowerCase() === context.userBranch.toLowerCase()
    ) {
      score += 15;
    }

    // 4. Engagement score: likes (2 pts each) and comments (4 pts each)
    score += (post.likes_count || 0) * 2;
    score += (post.comments_count || 0) * 4;

    // 5. Freshness / Recency time decay (Score decreases as post gets older)
    // Half-life ~ 24 hours (86,400,000 ms)
    const postAgeMs = Math.max(0, now - new Date(post.created_at).getTime());
    const hoursOld = postAgeMs / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 50 - hoursOld * 1.5);
    score += recencyBonus;

    return { post, score };
  });

  // Sort descending by calculated score
  return scored.sort((a, b) => b.score - a.score).map((item) => item.post);
}
