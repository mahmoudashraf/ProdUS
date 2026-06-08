import PublicProductSharePanel from '@/features/platform/PublicProductSharePanel';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicProductSharePanel token={token} />;
}
