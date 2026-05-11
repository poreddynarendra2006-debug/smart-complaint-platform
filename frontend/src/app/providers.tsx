'use client';

import '../amplify-config';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}