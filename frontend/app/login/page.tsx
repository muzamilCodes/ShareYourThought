'use client';

import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="page container" style={{ maxWidth: '480px', padding: '24px 16px' }}>
      <AuthForm mode="login" />
    </div>
  );
}


