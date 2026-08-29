'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { api } from '../lib/api';

export function BottomNav() {
  const pathname = usePathname();
  const { session, ready } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (ready && session?.token) {
      api.listNotifications(session.token)
        .then((data) => {
          if (data?.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [ready, session?.token, pathname]);

  const profileHref = session?.user?.username ? `/profile/${session.user.username}` : '/profile';
  const userAvatar = session?.user?.avatar;

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: '🏠',
      isActive: pathname === '/'
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: '🔍',
      isActive: pathname === '/explore' || pathname === '/trending' || pathname.startsWith('/search')
    },
    {
      href: '/create',
      label: 'Create',
      icon: '➕',
      isFab: true,
      isActive: pathname === '/create'
    },
    {
      href: '/notifications',
      label: 'Alerts',
      icon: '🔔',
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null,
      isActive: pathname === '/notifications'
    },
    {
      href: profileHref,
      label: session ? 'Profile' : 'Account',
      icon: userAvatar ? (
        <img
          src={userAvatar}
          alt="Profile"
          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        '👤'
      ),
      isActive: pathname.startsWith('/profile') || pathname === '/login' || pathname === '/register'
    }
  ];

  return (
    <nav className="bottom-nav mobile-only" aria-label="Mobile Bottom Navigation">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottom-nav-fab ${item.isActive ? 'is-active' : ''}`}
                title={item.label}
                aria-label={item.label}
              >
                <span className="bottom-nav-fab-icon">{item.icon}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${item.isActive ? 'is-active' : ''}`}
              aria-label={item.label}
            >
              <div className="bottom-nav-icon-wrap">
                <span className="bottom-nav-icon">{item.icon}</span>
                {item.badge ? <span className="bottom-nav-badge">{item.badge}</span> : null}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
