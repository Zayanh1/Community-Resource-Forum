import Link from "next/link";
import { redirect } from "next/navigation";
import { PiArrowLeftBold } from "react-icons/pi";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";
import Post from "~/components/Post";

export default async function CollectionViewPage({ 
  params 
}: { 
  params: Promise<{ collectionId: string }> | { collectionId: string } 
}) {
  const resolvedParams = await params;
  const collectionId = resolvedParams.collectionId;

  const session = await getSession({
    user: { columns: { profileId: true } }
  });
  
  if (!session) redirect("/");

  const collection = await db.query.collections.findFirst({
    where: { id: collectionId, userProfileId: session.userProfileId }
  });

  if (!collection) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Collection not found</h2>
        <p className="text-gray-500 mt-2">This collection does not exist or you do not have permission to view it.</p>
        <Link href="/collections" className="mt-6 inline-block rounded-md bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-600">
          Back to Collections
        </Link>
      </div>
    );
  }

  const collectionData = await db.query.collectionPosts.findMany({
    where: { collectionId: collectionId },
    orderBy: { createdAt: "desc" },
    with: {
      post: {
        with: {
          author: true,
          event: true,
          tags: true,
          attachments: true,
          votes: {
            limit: 1,
            where: { userProfileId: session.userProfileId }
          }
        }
      }
    }
  });

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <Link href="/collections" className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-sky-700 transition-colors">
        <PiArrowLeftBold className="transition-transform group-hover:-translate-x-1" /> Back to Collections
      </Link>
      
      <div className="mb-8 rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900">{collection.name}</h1>
        {collection.description && <p className="mt-3 text-gray-600">{collection.description}</p>}
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
          {collectionData.length} {collectionData.length === 1 ? 'Post' : 'Posts'}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {collectionData.length === 0 ? (
          <div className="text-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <p className="text-gray-500">There are no posts in this collection yet.</p>
          </div>
        ) : (
          collectionData.map(({ post }) => (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm relative" key={post.id}>
              <Post
                post={post}
                author={post.author}
                event={post.event}
                tags={post.tags}
                attachments={post.attachments}
                vote={post.votes?.[0]}
                tagParam={[]}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}