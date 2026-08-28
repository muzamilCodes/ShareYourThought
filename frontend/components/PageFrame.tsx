'use client';

export function PageFrame({ eyebrow, title, copy, children, aside }: { eyebrow: string; title: string; copy: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="page-frame">
      <div className="page-frame-main">
        <div className="mono eyebrow">{eyebrow}</div>
        <h1 className="display-title display-title-xl">{title}</h1>
        <p className="section-copy section-copy-lg">{copy}</p>
        {children}
      </div>
      {aside ? <aside className="page-frame-aside">{aside}</aside> : null}
    </section>
  );
}
