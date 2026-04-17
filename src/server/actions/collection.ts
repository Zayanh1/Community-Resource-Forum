"use server"

import { eq, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getSession } from "../auth"
import { db } from "../db"
import { collectionPosts, collections } from "../db/schema/tables"

export async function getUserCollections() {
  const session = await getSession({
    user: { columns: { profileId: true } }
  })
  if (!session) return []

  return await db.query.collections.findMany({
    where: { userProfileId: session.userProfileId },
    orderBy: { createdAt: "desc" }
  })
}

export async function createCollection(name: string, description: string) {
  const session = await getSession({
    user: { columns: { profileId: true } }
  })
  if (!session) throw new Error("Unauthorized")

  await db.insert(collections).values({
    userProfileId: session.userProfileId,
    name,
    description
  })
  revalidatePath("/")
  revalidatePath("/collections")
}

export async function getPostCollectionIds(postId: string) {
  const session = await getSession({
    user: { columns: { profileId: true } }
  })
  if (!session) return []

  const result = await db.select({ collectionId: collectionPosts.collectionId })
    .from(collectionPosts)
    .innerJoin(collections, eq(collectionPosts.collectionId, collections.id))
    .where(and(
      eq(collectionPosts.postId, postId),
      eq(collections.userProfileId, session.userProfileId)
    ))

  return result.map((r) => r.collectionId)
}

export async function setPostCollections(postId: string, collectionIds: string[]) {
  const session = await getSession({
    user: { columns: { profileId: true } }
  })
  if (!session) throw new Error("Unauthorized")

  // Find user's collections to ensure they only edit their own
  const userCols = await db.query.collections.findMany({
    where: { userProfileId: session.userProfileId },
  })
  const userColIds = userCols.map((c: { id: string }) => c.id)

  if (userColIds.length > 0) {
    // Remove existing mappings for this post in user's collections
    await db.delete(collectionPosts).where(and(
      eq(collectionPosts.postId, postId),
      inArray(collectionPosts.collectionId, userColIds)
    ))
  }

  // Add new mappings for the selected checkboxes
  const validIds = collectionIds.filter(id => userColIds.includes(id))
  if (validIds.length > 0) {
    await db.insert(collectionPosts).values(
      validIds.map(id => ({ collectionId: id, postId }))
    )
  }

  revalidatePath("/")
  revalidatePath("/collections")
}