import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '../hooks/useSession';
import { StoryViewer, type AuthorStoryGroup } from './StoryViewer';
import { StoryCreatorModal } from './StoryCreatorModal';
import type { Thought } from '../types';

interface StoryTrayProps {
  thoughts?: Thought[];
  onRefresh?: () => void;
}

export function StoryTray({ thoughts = [], onRefresh }: StoryTrayProps) {
  const { session } = useSession();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Group thoughts by author
  const storyGroups: AuthorStoryGroup[] = [];
  const authorIndexMap = new Map<string, number>();

  const currentUsername = session?.user?.username?.toLowerCase();
  const currentUserId = session?.user?._id || session?.user?.id;

  // First collect current user's thoughts if any
  const myThoughts = thoughts.filter((t) => {
    const author = t.author;
    if (!author) return false;
    const authId = typeof author === 'string' ? author : author._id || author.id;
    const authUser = typeof author === 'object' ? author.username?.toLowerCase() : '';
    return (currentUserId && authId === currentUserId) || (currentUsername && authUser === currentUsername);
  });

  if (session?.user && myThoughts.length > 0) {
    const myName = session.user.name || session.user.username || 'You';
    const myAvatar =
      session.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(myName)}`;

    storyGroups.push({
      authorName: myName,
      authorUsername: session.user.username,
      authorAvatar: myAvatar,
      isSelf: true,
      thoughts: myThoughts
    });
    authorIndexMap.set(session.user.username.toLowerCase(), 0);
  }

  // Next group other authors' thoughts
  thoughts.forEach((t) => {
    const author = t.author;
    if (!author) return;
    const username = typeof author === 'object' ? author.username : '';
    if (!username) return;

    const lowerUsername = username.toLowerCase();
    if (session?.user && lowerUsername === currentUsername) {
      return; // already handled
    }

    if (authorIndexMap.has(lowerUsername)) {
      const idx = authorIndexMap.get(lowerUsername)!;
      storyGroups[idx].thoughts.push(t);
    } else {
      const name = typeof author === 'object' ? author.name || username : username;
      const avatar =
        typeof author === 'object' && author.avatar
          ? author.avatar
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || username)}`;

      const newIdx = storyGroups.length;
      storyGroups.push({
        authorName: name,
        authorUsername: username,
        authorAvatar: avatar,
        thoughts: [t]
      });
      authorIndexMap.set(lowerUsername, newIdx);
    }
  });

  const currentUserAvatar =
    session?.user?.avatar ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
      : 'https://api.dicebear.com/7.x/initials/svg?seed=You');

  const hasOwnStories = myThoughts.length > 0;

  return (
    <>
      <div className="story-tray-wrapper">
        <div className="story-tray">
          {/* Current User "Your Story" item */}
          <div className="story-item story-item-self" title={hasOwnStories ? 'View your story' : 'Add a story'}>
            <div
              className={`story-avatar-ring is-self ${hasOwnStories ? 'has-stories' : ''}`}
              onClick={() => {
                if (hasOwnStories) {
                  setActiveStoryIndex(0);
                } else {
                  setIsCreatorOpen(true);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={currentUserAvatar}
                alt={session?.user?.name || 'Your Story'}
                className="story-avatar"
              />
              <button
                type="button"
                className="story-add-badge"
                title="Create new story"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatorOpen(true);
                }}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                +
              </button>
            </div>
            <span className="story-username">Your Story</span>
          </div>

          {/* Community Creator Stories */}
          {storyGroups
            .filter((g) => !g.isSelf)
            .map((group) => {
              const groupRealIndex = storyGroups.findIndex((g) => g.authorUsername === group.authorUsername);
              return (
                <button
                  key={group.authorUsername}
                  type="button"
                  className="story-item story-item-btn"
                  onClick={() => setActiveStoryIndex(groupRealIndex)}
                  title={`Watch @${group.authorUsername}'s stories`}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div className="story-avatar-ring is-live">
                    <img
                      src={group.authorAvatar}
                      alt={group.authorName}
                      className="story-avatar"
                    />
                  </div>
                  <span className="story-username">{group.authorUsername}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Real Fullscreen / Modal Interactive Story Viewer */}
      {activeStoryIndex !== null && storyGroups[activeStoryIndex] ? (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      ) : null}

      {/* Quick Story Creator Modal */}
      <StoryCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onStoryCreated={() => {
          if (onRefresh) onRefresh();
          else window.location.reload();
        }}
      />
    </>
  );
}
