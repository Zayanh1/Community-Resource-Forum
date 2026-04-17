import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "~/server/auth"
import { db } from "~/server/db"
import { PiFolderBold } from "react-icons/pi"

export default async function CollectionsPage() {
  const session = await getSession({
    user: { columns: { profileId: true } }
  })
  
  if (!session) redirect("/")

  const userCollections = await db.query.collections.findMany({
    where: { userProfileId: session.userProfileId },
    orderBy: { createdAt: "desc" },
    with: {
      posts: {
        with: { post: true }
      }
    }
  })

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900 tracking-tight">My Collections</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {userCollections.map((col) => (
          <Link 
            key={col.id} 
            href={`/collections/${col.id}`}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200"
          >
            <div className="mb-3 flex items-center text-sky-700">
              <PiFolderBold size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-sky-700 transition-colors">{col.name}</h2>
            <p className="mb-4 mt-2 text-sm text-gray-600 flex-1 line-clamp-2">{col.description}</p>
            <div className="mt-auto text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {col.posts?.length ?? 0} {col.posts?.length === 1 ? 'Post' : 'Posts'}
            </div>
          </Link>
        ))}
      </div>
      {userCollections.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50">
          <PiFolderBold size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No collections yet</h3>
          <p className="text-gray-500 mt-1 max-w-sm">Save posts from your feed to organize them into collections.</p>
        </div>
      )}
    </div>
  )
}