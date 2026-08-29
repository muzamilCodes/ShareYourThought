'use client';

import Link from 'next/link';
import { useSession } from '../hooks/useSession';
import type { Thought } from '../types';

interface StoryTrayProps {
  thoughts?: Thought[];
}

export function StoryTray({ thoughts = [] }: StoryTrayProps) {
  const { session } = useSession();

  // Extract unique authors from thoughts for the story tray
  const uniqueAuthors: Array<{ name: string; username: string; avatar: string; thoughtId?: string }> = [];
  const seenUsernames = new Set<string>();

  if (session?.user) {
    seenUsernames.add(session.user.username);
  }

  thoughts.forEach((t) => {
    const username = t.author?.username;
    if (username && !seenUsernames.has(username)) {
      seenUsernames.add(username);
      uniqueAuthors.push({
        name: t.author.name || username,
        username: t.author.username,
        avatar: t.author.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.author.name || username)}`,
        thoughtId: t._id
      });
    }
  });

  return (
    <div className="story-tray-wrapper">
      <div className="story-tray">
        {/* Current User "Your Story / Post" */}
        <Link href="/create" className="story-item story-item-self" title="Share a new thought">
          <div className="story-avatar-ring is-self">
            <img
              src={session?.user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=You'}
              alt={session?.user?.name || 'Your Story'}
              className="story-avatar"
            />
            <span className="story-add-badge">+</span>
          </div>
          <span className="story-username">Your Story</span>
        </Link>

        {/* Community Creator Stories */}
        {uniqueAuthors.map((author) => (
          <Link
            key={author.username}
            href={`/profile/${author.username}`}
            className="story-item"
            title={`View @${author.username}`}
          >
            <div className="story-avatar-ring is-live">
              <img
                src={author.avatar}
                alt={author.name}
                className="story-avatar"
              />
            </div>
            <span className="story-username">{author.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
