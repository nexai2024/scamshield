'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { getCommunityPosts, addCommunityPost, clearCommunityPosts } from '@/lib/utils/communityPosts';
import type { CommunityPost } from '@/lib/types';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function CommunityPage() {
  const toast = useToast();
  const [text, setText] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    setPosts(getCommunityPosts());
  }, []);

  const canSubmit = text.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const post: CommunityPost = {
      id: generateId(),
      date: new Date().toISOString(),
      text: text.trim(),
    };

    addCommunityPost(post);
    setPosts((prev) => [post, ...prev]);
    setText('');
    toast.showToast('Scam report posted to community.');
  };

  const handleClear = () => {
    clearCommunityPosts();
    setPosts([]);
    toast.showToast('Community posts cleared.');
  };

  const hasPosts = posts.length > 0;

  const postCountLabel = useMemo(() => {
    const count = posts.length;
    return `${count} post${count === 1 ? '' : 's'}`;
  }, [posts.length]);

  return (
    <div className="mx-auto px-4 py-12 max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community Scam Reports</h1>
          <p className="text-sm text-slate-500">Share a scam example and learn from other users. All posts are stored locally in your browser.</p>
        </div>
        <Link href="/dashboard" className="rounded-lg px-4 py-2 bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 shadow-sm shadow-teal-600/20 transition">Back to Scanner</Link>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 border rounded-2xl p-5 shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Describe the scam message, URL, or social tactic you found..."
          className="w-full p-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Minimum 10 characters</span>
          <button type="submit" disabled={!canSubmit} className={`px-4 py-2 rounded-lg font-semibold text-sm ${canSubmit ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>
            Post to Community
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Community Posts ({postCountLabel})</h2>
        {hasPosts && (
          <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
        )}
      </div>

      {!hasPosts ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No posts yet — be the first to share a scam alert.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="p-4 bg-white border rounded-xl shadow-sm">
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{post.text}</p>
              <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                <span>{new Date(post.date).toLocaleString()}</span>
                {post.risk_score != null && <span>Risk {post.risk_score} ({post.risk_level ?? 'unknown'})</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
