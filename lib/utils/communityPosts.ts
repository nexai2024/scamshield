import type { CommunityPost } from '@/lib/types';

const COMMUNITY_POSTS_KEY = 'scamshield_community_posts';

function getStoredPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CommunityPost[];
  } catch {
    return [];
  }
}

function setStoredPosts(posts: CommunityPost[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));
}

export function getCommunityPosts(): CommunityPost[] {
  return getStoredPosts().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addCommunityPost(post: CommunityPost): CommunityPost {
  const posts = getStoredPosts();
  const newPosts = [post, ...posts];
  setStoredPosts(newPosts);
  return post;
}

export function clearCommunityPosts(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COMMUNITY_POSTS_KEY);
}
