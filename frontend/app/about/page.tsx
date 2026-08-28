import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="page container">
      <section className="page-frame">
        <div className="page-frame-main">
          <div className="mono eyebrow">About</div>
          <h1 className="display-title display-title-xl">A premium editorial platform for thoughts and ideas.</h1>
          <p className="section-copy section-copy-lg">ThoughtShare uses the same quiet visual grammar as the Halden reference — paper tones, black sections, large serif headlines, small monospace labels, thin borders, and elegant spacing — but the product itself is a fully functional social platform for publishing, discovery, and conversation.</p>
          <div className="button-row">
            <Link href="/explore" className="button">Explore</Link>
            <Link href="/create" className="button-outline">Share a Thought</Link>
          </div>
        </div>
        <aside className="page-frame-aside">
          <div className="note-card"><div className="mono">Principle 01</div><p className="note-copy">Thoughts first. The interface should never overpower the writing.</p></div>
          <div className="note-card"><div className="mono">Principle 02</div><p className="note-copy">Real data. MongoDB, JWT auth, follows, likes, comments, notifications, and search.</p></div>
          <div className="note-card"><div className="mono">Principle 03</div><p className="note-copy">Editorial pacing. Calm motion, generous spacing, and responsive layouts.</p></div>
        </aside>
      </section>
    </div>
  );
}
