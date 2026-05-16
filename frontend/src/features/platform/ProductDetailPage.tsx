'use client';

import { useParams } from 'next/navigation';
import OwnerProductizationWorkspace from './OwnerProductizationWorkspace';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();

  return params?.id ? <OwnerProductizationWorkspace productId={params.id} /> : <OwnerProductizationWorkspace />;
}
