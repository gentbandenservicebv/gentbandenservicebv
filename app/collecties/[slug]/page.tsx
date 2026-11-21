import { Suspense } from "react";
import CollectionDetail from "./CollectionDetail";
import CollectionDetailSkeleton from "./CollectionDetailSkeleton";

// This page fetches per-slug data at runtime — blocking is intentional.
// @next-codemod-ignore
export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<CollectionDetailSkeleton />}>
      <CollectionDetail slug={slug} />
    </Suspense>
  );
}
