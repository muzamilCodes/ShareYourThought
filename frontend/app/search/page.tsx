import { Suspense } from 'react';
import SearchClient from './search-client';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page container"><p className="empty-state">Loading search…</p></div>}>
      <SearchClient initialQuery="" />
    </Suspense>
  );
}
