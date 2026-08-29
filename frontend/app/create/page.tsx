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
    <div className="page container" style={{ maxWidth: '650px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="display-title" style={{ fontSize: '1.75rem', margin: '0 0 6px 0', color: 'var(--ink)' }}>
          Publish something worth keeping.
        </h1>
      </div>
      <CreateThought categories={categories} />
    </div>
  );
}
