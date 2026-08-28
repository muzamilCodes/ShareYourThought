'use client';

import Link from 'next/link';

const sections = [
  {
    title: 'Platform',
    links: [
      { href: '/', label: 'Home' },
      { href: '/explore', label: 'Explore' },
      { href: '/trending', label: 'Trending' },
      { href: '/create', label: 'Share a Thought' }
    ],
    external: false
  },
  {
    title: 'Community',
    links: [
      { href: '/notifications', label: 'Notifications' },
      { href: '/search', label: 'Search' },
      { href: '/settings', label: 'Settings' },
      { href: '/about', label: 'About' }
    ],
    external: false
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Privacy' },
      { href: '#', label: 'Terms' },
      { href: '#', label: 'Contact' },
      { href: '#', label: 'Careers' }
    ],
    external: true
  },
  {
    title: 'Social',
    links: [
      { href: '#', label: 'Instagram' },
      { href: '#', label: 'X / Twitter' },
      { href: '#', label: 'LinkedIn' },
      { href: '#', label: 'RSS' }
    ],
    external: true
  }
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <p className="footer-brand">ThoughtShare</p>
            <p className="footer-copy">A quiet editorial network for people who want to share thoughts, discover new perspectives, and build real conversation around ideas.</p>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <p className="footer-title">{section.title}</p>
              <ul className="footer-list">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {section.external ? <a href={link.href}>{link.label}</a> : <Link href={link.href}>{link.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p className="footer-meta">© 2026 ThoughtShare. Built for thoughtful publishing.</p>
          <p className="footer-meta">Minimal interface. Real discussion. Premium editorial feel.</p>
        </div>
      </div>
    </footer>
  );
}
