'use client';

import { useEffect, useState } from 'react';
import { CreateThought } from '@/components/CreateThought';
import { SectionHeading } from '@/components/SectionHeading';
import { api } from '@/lib/api';
import type { Category } from '@/types';

export default function CreatePage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.listCategories().then((data) => setCategories(data.categories)).catch(() => undefined);
  }, []);

  return (
    <div className="page container">
      <section className="page-frame">
        <div className="page-frame-main">
          <div className="mono eyebrow">Create Thought</div>
          <h1 className="display-title display-title-xl">Publish something worth keeping.</h1>
          <p className="section-copy section-copy-lg">Authenticated users can write a thought, attach an optional image URL, choose a category, and add hashtags before publishing.</p>
          <CreateThought categories={categories} />
        </div>
        <aside className="page-frame-aside">
          <div className="note-card"><div className="mono">Publishing tips</div><p className="note-copy">Keep the first sentence clear. Use hashtags sparingly. One strong idea is enough.</p></div>
          <div className="note-card"><div className="mono">Categories</div><p className="note-copy">The backend stores structured categories so explore and trending can stay meaningful.</p></div>
        </aside>
      </section>
    </div>
  );
}
