'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { playSuccessSound } from '@/lib/soundUtils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SocialActivityTimeline } from '@/components/SocialActivityTimeline';
import type { Category, Thought, User } from '@/types';

interface AdminStats {
  totalUsers: number;
  totalThoughts: number;
  totalComments: number;
  totalCategories: number;
  featuredThoughtsCount: number;
  totalViews: number;
  totalShares: number;
  totalLikes: number;
  recentUsers: User[];
  recentThoughts: Thought[];
  topCategories: Category[];
  timeline?: any[];
  systemHealth?: any;
}

export default function AdminPage() {
  const { session, ready } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'thoughts' | 'categories'>('overview');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Thoughts Moderation State
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [thoughtSearch, setThoughtSearch] = useState('');
  const [thoughtCategoryFilter, setThoughtCategoryFilter] = useState('');
  const [thoughtFeaturedFilter, setThoughtFeaturedFilter] = useState('');
  const [thoughtPage, setThoughtPage] = useState(1);
  const [thoughtTotalPages, setThoughtTotalPages] = useState(1);
  const [loadingThoughts, setLoadingThoughts] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatAccent, setNewCatAccent] = useState('ember');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: async () => {}
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Overview Stats
  const fetchStats = async () => {
    if (!session?.token) return;
    setLoadingStats(true);
    try {
      const data = await api.getAdminStats(session.token);
      setStats(data);
      if (data.recentUsers && data.recentUsers.length > 0) {
        setUsers((prev) => (prev.length > 0 ? prev : data.recentUsers));
      }
      if (data.recentThoughts && data.recentThoughts.length > 0) {
        setThoughts((prev) => (prev.length > 0 ? prev : data.recentThoughts));
      }
      if (data.topCategories) {
        setCategories(data.topCategories);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Users List
  const fetchUsers = async () => {
    if (!session?.token) return;
    setLoadingUsers(true);
    try {
      const data = await api.listAdminUsers(
        { page: userPage, limit: 20, search: userSearch, role: userRoleFilter },
        session.token
      );
      setUsers(data.items || []);
      setUserTotalPages(data.pagination?.totalPages || 1);
    } catch {
      // If fail, fallback to searchUsers
      try {
        const u = await api.searchUsers(userSearch || '');
        setUsers(u.users || []);
      } catch {
        setUsers([]);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Thoughts List
  const fetchThoughts = async () => {
    if (!session?.token) return;
    setLoadingThoughts(true);
    try {
      const data = await api.listAdminThoughts(
        {
          page: thoughtPage,
          limit: 20,
          search: thoughtSearch,
          category: thoughtCategoryFilter,
          featured: thoughtFeaturedFilter
        },
        session.token
      );
      setThoughts(data.items || []);
      setThoughtTotalPages(data.pagination?.totalPages || 1);
    } catch {
      // If fail, fallback explore
      try {
        const exp = await api.exploreThoughts(1, 'latest');
        setThoughts(exp.thoughts || []);
      } catch {
        setThoughts([]);
      }
    } finally {
      setLoadingThoughts(false);
    }
  };

  // Load Categories List
  const fetchCategories = async () => {
    try {
      const res = await api.listCategories();
      setCategories(res.categories || []);
    } catch {
      // ignore
    }
  };

  // Initial mount load all
  useEffect(() => {
    if (session?.token) {
      fetchStats();
      fetchUsers();
      fetchThoughts();
      fetchCategories();
    }
  }, [session?.token]);

  // Tab changes / filters
  useEffect(() => {
    if (session?.token && activeTab === 'users') {
      fetchUsers();
    }
  }, [session?.token, activeTab, userPage, userRoleFilter, userSearch]);

  useEffect(() => {
    if (session?.token && activeTab === 'thoughts') {
      fetchThoughts();
    }
  }, [session?.token, activeTab, thoughtPage, thoughtCategoryFilter, thoughtFeaturedFilter, thoughtSearch]);

  // Handle Role Toggle (Promote/Demote)
  const handleToggleRole = async (user: User) => {
    if (!session?.token) return;
    const targetRole = user.role === 'admin' ? 'user' : 'admin';
    const actionName = targetRole === 'admin' ? 'Promote to Admin' : 'Demote to User';

    setConfirmModal({
      isOpen: true,
      title: `${actionName}?`,
      message: `Are you sure you want to change @${user.username}'s role to ${targetRole.toUpperCase()}?`,
      confirmText: actionName,
      type: targetRole === 'admin' ? 'warning' : 'danger',
      onConfirm: async () => {
        try {
          const uId = user._id || user.id || '';
          if (!uId) return;
          await api.updateAdminUserRole(uId, targetRole, session.token);
          playSuccessSound();
          showToast(`@${user.username} is now ${targetRole}`);
          fetchUsers();
          fetchStats();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Action failed');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle User Deletion
  const handleDeleteUser = (user: User) => {
    if (!session?.token) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete @${user.username}?`,
      message: `This will permanently remove @${user.username} and cascade delete all their published thoughts and comments. This cannot be undone.`,
      confirmText: 'Permanently Delete User',
      type: 'danger',
      onConfirm: async () => {
        try {
          const uId = user._id || user.id || '';
          if (!uId) return;
          await api.deleteAdminUser(uId, session.token);
          playSuccessSound();
          showToast(`User @${user.username} deleted`);
          fetchUsers();
          fetchStats();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not delete user');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle Feature Thought Toggle
  const handleToggleFeatureThought = async (thought: Thought) => {
    if (!session?.token) return;
    try {
      const res = await api.toggleAdminFeatureThought(thought._id, session.token);
      playSuccessSound();
      showToast(res.message || 'Updated thought');
      setThoughts((prev) =>
        prev.map((t) => (t._id === thought._id ? { ...t, featured: !t.featured } : t))
      );
      fetchStats();
    } catch {
      showToast('Could not update feature status');
    }
  };

  // Handle Thought Deletion
  const handleDeleteThought = (thought: Thought) => {
    if (!session?.token) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Thought Post?',
      message: `Permanently delete this thought and its comments by ${
        thought.author && typeof thought.author === 'object' && 'name' in thought.author && thought.author.name
          ? thought.author.name
          : 'Creator'
      }?`,
      confirmText: 'Delete Post',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteAdminThought(thought._id, session.token);
          playSuccessSound();
          showToast('Thought removed from platform');
          setThoughts((prev) => prev.filter((t) => t._id !== thought._id));
          fetchStats();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not delete thought');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !session?.token || creatingCategory) return;

    setCreatingCategory(true);
    try {
      await api.createAdminCategory(
        { name: newCatName.trim(), description: newCatDesc.trim(), accent: newCatAccent },
        session.token
      );
      playSuccessSound();
      showToast(`Category #${newCatName.trim()} created!`);
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Handle Category Deletion
  const handleDeleteCategory = (cat: Category) => {
    if (!session?.token) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete Category #${cat.name}?`,
      message: `Are you sure you want to delete the category #${cat.name}?`,
      confirmText: 'Delete Category',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteAdminCategory(cat._id || cat.slug, session.token);
          playSuccessSound();
          showToast(`Category #${cat.name} deleted`);
          fetchCategories();
          fetchStats();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not delete category');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Guard: Not Logged In
  if (ready && !session) {
    return (
      <div className="page container" style={{ maxWidth: '600px', padding: '60px 16px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--paper)',
            borderRadius: '24px',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '14px' }}>🛡️</span>
          <h1 className="display-title" style={{ fontSize: '1.6rem', color: 'var(--ink)', marginBottom: '8px' }}>
            Admin Command Center
          </h1>
          <p className="section-copy" style={{ fontSize: '0.92rem', margin: '0 auto 24px auto', maxWidth: '40ch' }}>
            Please sign in to access creator management, real-time trading activity timeline, and platform moderation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/login" className="button">
              Sign In to Continue 🚪
            </Link>
            <Link href="/" className="button-outline">
              ← Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Display users list (combine users or fallback to recentUsers)
  const allDisplayUsers = users.length > 0 ? users : (stats?.recentUsers || []);

  return (
    <div className="page container" style={{ maxWidth: '1080px', padding: '20px 16px 80px 16px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            background: 'var(--paper)',
            color: 'var(--ink)',
            padding: '12px 20px',
            borderRadius: '16px',
            border: '1px solid var(--ember)',
            boxShadow: '0 12px 32px rgba(200, 109, 52, 0.25)',
            fontSize: '0.90rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* =========================================================
          ADMIN HEADER
      ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h1 className="display-title" style={{ fontSize: '1.6rem', margin: 0, color: 'var(--ink)' }}>
              Admin Command Center
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                background: 'var(--ember)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}
            >
              Master Admin
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>
            Real-time platform oversight, creator moderation, content management, and community health.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchUsers();
              fetchThoughts();
              showToast('Refreshed real-time data');
            }}
            className="button-ghost"
            style={{ fontSize: '0.84rem', padding: '8px 14px', borderRadius: '14px', border: '1px solid var(--line)' }}
          >
            🔄 Refresh
          </button>
          <Link href="/" className="button-outline" style={{ fontSize: '0.84rem', padding: '8px 14px', borderRadius: '14px' }}>
            View Live Site ↗
          </Link>
        </div>
      </div>

      {/* =========================================================
          METRIC STATS OVERVIEW CARDS
      ========================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Total Users */}
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.80rem', fontWeight: 700 }}>
            <span>TOTAL USERS</span>
            <span style={{ fontSize: '1.2rem' }}>👥</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', marginTop: '6px' }}>
            {loadingStats ? '…' : (stats?.totalUsers ?? allDisplayUsers.length ?? 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ember)', fontWeight: 600 }}>
            Registered Accounts
          </span>
        </div>

        {/* Card 2: Total Thoughts */}
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.80rem', fontWeight: 700 }}>
            <span>TOTAL THOUGHTS</span>
            <span style={{ fontSize: '1.2rem' }}>✍️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', marginTop: '6px' }}>
            {loadingStats ? '…' : (stats?.totalThoughts ?? thoughts.length ?? 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
            Published Thoughts
          </span>
        </div>

        {/* Card 3: Total Likes */}
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.80rem', fontWeight: 700 }}>
            <span>TOTAL LIKES</span>
            <span style={{ fontSize: '1.2rem' }}>❤️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', marginTop: '6px' }}>
            {loadingStats ? '…' : (stats?.totalLikes ?? 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
            Post Likes Given
          </span>
        </div>

        {/* Card 4: Total Comments */}
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.80rem', fontWeight: 700 }}>
            <span>TOTAL COMMENTS</span>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', marginTop: '6px' }}>
            {loadingStats ? '…' : (stats?.totalComments ?? 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
            User Comments
          </span>
        </div>
      </div>

      {/* =========================================================
          SIMPLE & INTUITIVE 7-DAY SOCIAL ACTIVITY TIMELINE
      ========================================================= */}
      <SocialActivityTimeline
        timeline={stats?.timeline}
        totalUsers={stats?.totalUsers || allDisplayUsers.length || 2}
        totalThoughts={stats?.totalThoughts ?? thoughts.length}
        totalViews={stats?.totalViews ?? (thoughts.reduce((acc, t) => acc + (t.viewsCount || 0), 0) || 28)}
        totalEngagement={((stats?.totalLikes || 0) + (stats?.totalComments || 0)) || 14}
      />

      {/* =========================================================
          ADMIN NAVIGATION TABS
      ========================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--dark-soft)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'overview' ? 'var(--paper)' : 'transparent',
            color: activeTab === 'overview' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'overview' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 150ms ease'
          }}
        >
          📊 Overview Activity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'users' ? 'var(--paper)' : 'transparent',
            color: activeTab === 'users' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'users' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 150ms ease'
          }}
        >
          👥 User Management ({stats?.totalUsers || allDisplayUsers.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('thoughts')}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'thoughts' ? 'var(--paper)' : 'transparent',
            color: activeTab === 'thoughts' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'thoughts' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 150ms ease'
          }}
        >
          ✍️ Content Moderation ({stats?.totalThoughts || thoughts.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'categories' ? 'var(--paper)' : 'transparent',
            color: activeTab === 'categories' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'categories' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 150ms ease'
          }}
        >
          🏷️ Categories ({categories.length})
        </button>
      </div>

      {/* =========================================================
          TAB 1: OVERVIEW ACTIVITY
      ========================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Registered Users Feed */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--ink)' }}>✨ Platform Creators ({allDisplayUsers.length})</strong>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                style={{ background: 'none', border: 'none', color: 'var(--ember)', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Manage all →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allDisplayUsers.map((u) => (
                <div
                  key={u._id || u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--dark-soft)',
                    borderRadius: '14px'
                  }}
                >
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                    alt={u.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name} {u.role === 'admin' && <span style={{ fontSize: '0.70rem', color: 'var(--ember)' }}>🛡️ (Admin)</span>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>@{u.username} · {u.email}</div>
                  </div>
                  <Link
                    href={`/profile/${u.username}`}
                    className="button-ghost"
                    style={{ fontSize: '0.76rem', padding: '4px 8px', borderRadius: '8px' }}
                  >
                    Profile ↗
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Thoughts Stream */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--ink)' }}>📝 Latest Published Thoughts</strong>
              <button
                type="button"
                onClick={() => setActiveTab('thoughts')}
                style={{ background: 'none', border: 'none', color: 'var(--ember)', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Moderate all →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(thoughts.length > 0 ? thoughts.slice(0, 6) : (stats?.recentThoughts || [])).map((t) => {
                if (!t) return null;
                const author = t.author && typeof t.author === 'object' ? t.author : null;
                const authorUsername = author?.username || 'user';

                return (
                  <div
                    key={t._id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--dark-soft)',
                      borderRadius: '14px',
                      fontSize: '0.86rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.80rem' }}>
                        @{authorUsername}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>#{t.category || 'general'}</span>
                    </div>
                    <p style={{ margin: '0 0 6px 0', color: 'var(--ink)', lineHeight: 1.4 }}>
                      {t.content && t.content.length > 90 ? `${t.content.slice(0, 90)}…` : t.content || ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--muted)' }}>
                      <span>👁️ {t.viewsCount || 0} · 💬 {t.commentsCount || 0}</span>
                      {t.featured && <span style={{ color: 'var(--ember)', fontWeight: 700 }}>⭐ Featured</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: USER MANAGEMENT (SEARCH, ROLE TOGGLE, DELETE)
      ========================================================= */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '24px' }}>
          {/* Header & Description */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                👥 Registered Creators & User Accounts
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                Manage account permissions, promote creators to admin, or remove accounts.
              </p>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ember)', background: 'var(--dark-soft)', padding: '4px 12px', borderRadius: '8px' }}>
              Total: {users.length} {userRoleFilter ? `${userRoleFilter}s` : 'accounts'}
            </span>
          </div>

          {/* Search and Role Filter Pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name, username, or email…"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                style={{
                  width: '100%',
                  background: 'var(--dark-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '9px 14px 9px 36px',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  outline: 'none'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.90rem' }}>
                🔍
              </span>
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--dark-soft)', padding: '4px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setUserRoleFilter('');
                  setUserPage(1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: userRoleFilter === '' ? 'var(--paper)' : 'transparent',
                  color: userRoleFilter === '' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: userRoleFilter === '' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                All Roles
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRoleFilter('admin');
                  setUserPage(1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: userRoleFilter === 'admin' ? 'var(--paper)' : 'transparent',
                  color: userRoleFilter === 'admin' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: userRoleFilter === 'admin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                🛡️ Admins
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRoleFilter('user');
                  setUserPage(1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: userRoleFilter === 'user' ? 'var(--paper)' : 'transparent',
                  color: userRoleFilter === 'user' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: userRoleFilter === 'user' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                👤 Regular Users
              </button>
            </div>
          </div>

          {/* Users Table / Grid */}
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Loading creators…
            </div>
          ) : users.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((u) => {
                const uId = u._id || u.id || '';
                const isMe = session?.user && (session.user._id === uId || session.user.id === uId);
                const isUserAdmin = u.role === 'admin';

                return (
                  <div
                    key={uId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '14px 18px',
                      background: 'var(--dark-soft)',
                      borderRadius: '16px',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--ink)' }}>{u.name}</strong>
                          <span
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isUserAdmin ? 'var(--ember)' : 'rgba(0,0,0,0.08)',
                              color: isUserAdmin ? '#ffffff' : 'var(--muted)'
                            }}
                          >
                            {isUserAdmin ? 'ADMIN 🛡️' : 'USER'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.80rem', color: 'var(--muted)', marginTop: '2px' }}>
                          @{u.username} · {u.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        href={`/profile/${u.username}`}
                        className="button-ghost"
                        style={{ fontSize: '0.80rem', padding: '6px 12px', borderRadius: '10px' }}
                      >
                        Profile ↗
                      </Link>

                      {!isMe ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            className="button-outline"
                            style={{
                              fontSize: '0.80rem',
                              padding: '6px 12px',
                              borderRadius: '10px',
                              color: isUserAdmin ? '#ef4444' : 'var(--ember)',
                              fontWeight: 700
                            }}
                          >
                            {isUserAdmin ? 'Demote to User' : 'Promote to Admin 🛡️'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              fontSize: '0.80rem',
                              fontWeight: 700,
                              padding: '6px 12px',
                              borderRadius: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.80rem', color: 'var(--ember)', fontWeight: 700, padding: '0 8px' }}>
                          (You - Superadmin)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--dark-soft)', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                No creators found
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: '0 0 14px 0' }}>
                {userRoleFilter === 'user'
                  ? 'Currently, all registered accounts have the Admin role.'
                  : userSearch
                  ? `No accounts matched "${userSearch}".`
                  : 'No creators registered yet.'}
              </p>
              {(userSearch || userRoleFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch('');
                    setUserRoleFilter('');
                    setUserPage(1);
                  }}
                  className="button-primary"
                  style={{ fontSize: '0.82rem', padding: '6px 16px', borderRadius: '10px' }}
                >
                  Clear Filters & Show All
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {userTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                className="button-ghost"
                style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                ← Prev
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.84rem', color: 'var(--muted)' }}>
                Page {userPage} of {userTotalPages}
              </span>
              <button
                type="button"
                disabled={userPage >= userTotalPages}
                onClick={() => setUserPage((p) => p + 1)}
                className="button-ghost"
                style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: THOUGHT CONTENT MODERATION (SEARCH, FEATURE, DELETE)
      ========================================================= */}
      {activeTab === 'thoughts' && (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search thought content or hashtags…"
              value={thoughtSearch}
              onChange={(e) => {
                setThoughtSearch(e.target.value);
                setThoughtPage(1);
              }}
              style={{
                flex: 1,
                minWidth: '240px',
                background: 'var(--dark-soft)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.88rem',
                color: 'var(--ink)',
                outline: 'none'
              }}
            />

            <select
              value={thoughtFeaturedFilter}
              onChange={(e) => {
                setThoughtFeaturedFilter(e.target.value);
                setThoughtPage(1);
              }}
              style={{
                background: 'var(--dark-soft)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.86rem',
                color: 'var(--ink)',
                outline: 'none'
              }}
            >
              <option value="">All Status</option>
              <option value="true">⭐ Featured Only</option>
              <option value="false">Standard Only</option>
            </select>
          </div>

          {/* Thoughts List */}
          {thoughts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {thoughts.map((t) => {
                if (!t) return null;
                const author = t.author && typeof t.author === 'object' ? t.author : null;
                const authorName = author?.name || 'Creator';
                const authorUsername = author?.username || 'user';
                const authorAvatar =
                  author?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

                return (
                  <div
                    key={t._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      padding: '14px 18px',
                      background: 'var(--dark-soft)',
                      borderRadius: '16px',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '280px' }}>
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.90rem', color: 'var(--ink)' }}>{authorName}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{authorUsername}</span>
                          <span style={{ fontSize: '0.74rem', background: 'var(--paper)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                            #{t.category}
                          </span>
                          {t.featured && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--ember)', fontWeight: 800 }}>
                              ⭐ FEATURED
                            </span>
                          )}
                        </div>

                        <p style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                          {t.content}
                        </p>

                        {t.imageUrl && (
                          <div style={{ marginBottom: '8px', maxWidth: '160px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={t.imageUrl} alt="Attached" style={{ width: '100%', height: 'auto', display: 'block' }} />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: 'var(--muted)' }}>
                          <span>👁️ {t.viewsCount || 0} views</span>
                          <span>❤️ {t.likes?.length || 0} likes</span>
                          <span>💬 {t.commentsCount || 0} comments</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatureThought(t)}
                        className={t.featured ? 'button-outline' : 'button'}
                        style={{ fontSize: '0.80rem', padding: '6px 12px', borderRadius: '10px' }}
                      >
                        {t.featured ? 'Unfeature' : '⭐ Feature on Trending'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteThought(t)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '0.80rem',
                          fontWeight: 700,
                          padding: '6px 10px',
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete Post
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No thoughts match filter.</div>
          )}

          {/* Pagination */}
          {thoughtTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                disabled={thoughtPage <= 1}
                onClick={() => setThoughtPage((p) => Math.max(1, p - 1))}
                className="button-ghost"
                style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                ← Prev
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.84rem', color: 'var(--muted)' }}>
                Page {thoughtPage} of {thoughtTotalPages}
              </span>
              <button
                type="button"
                disabled={thoughtPage >= thoughtTotalPages}
                onClick={() => setThoughtPage((p) => p + 1)}
                className="button-ghost"
                style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 4: CATEGORY MANAGER (CREATE / DELETE)
      ========================================================= */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Create Category Form */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
            <strong style={{ fontSize: '1.05rem', color: 'var(--ink)', display: 'block', marginBottom: '14px' }}>
              ➕ Create Topic Category
            </strong>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="field">
                <label className="label" style={{ fontSize: '0.82rem' }}>Category Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Design, Crypto, Philosophy…"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="label" style={{ fontSize: '0.82rem' }}>Description (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Brief description for category banner…"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label" style={{ fontSize: '0.82rem' }}>Color Theme</label>
                <select
                  className="input"
                  value={newCatAccent}
                  onChange={(e) => setNewCatAccent(e.target.value)}
                >
                  <option value="ember">Ember Terracotta</option>
                  <option value="indigo">Indigo Blue</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="purple">Purple Twilight</option>
                  <option value="rose">Rose Pink</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingCategory || !newCatName.trim()}
                className="button"
                style={{ width: '100%', minHeight: '44px', fontWeight: 700 }}
              >
                {creatingCategory ? 'Creating…' : 'Add Category 🚀'}
              </button>
            </form>
          </div>

          {/* Current Categories List */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
            <strong style={{ fontSize: '1.05rem', color: 'var(--ink)', display: 'block', marginBottom: '14px' }}>
              🏷️ Active Community Topics ({categories.length})
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {categories.map((c) => (
                <div
                  key={c._id || c.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--dark-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--line)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.90rem', color: 'var(--ink)' }}>#{c.name}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                      {c.thoughtCount || 0} published thoughts
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link
                      href={`/explore?category=${c.slug}`}
                      className="button-ghost"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}
                    >
                      View →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.80rem',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Delete Category"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
