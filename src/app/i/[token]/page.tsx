'use client';

import { use } from 'react';
import { InviteAcceptPage } from '../../../features/invite/InviteAcceptPage';

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <InviteAcceptPage token={token} />;
}
