import { defineRelations } from "drizzle-orm";
import * as tables from "./tables";

const relations = defineRelations(tables, (r) => ({
  events: {
    organizer: r.one.profiles({
      from: r.events.organizerId,
      to: r.profiles.id,
      optional: false,
    }),
  },
  posts: {
    author: r.one.profiles({
      from: r.posts.authorId,
      to: r.profiles.id,
      optional: false,
    }),
    event: r.one.events({
      from: r.posts.eventId,
      to: r.events.id,
    }),
    tags: r.many.tags({
      from: r.posts.id.through(r.tagsToPosts.postId),
      to: r.tags.id.through(r.tagsToPosts.tagId),
    }),
    votes: r.many.postVotes({
      from: r.posts.id,
      to: r.postVotes.postId,
    }),
    comments: r.many.comments({
      from: r.posts.id,
      to: r.comments.postId,
    }),
  },
  comments: {
    author: r.one.profiles({
      from: r.comments.authorId,
      to: r.profiles.id,
      optional: false,
    }),
    originalPost: r.one.posts({
      from: r.comments.postId,
      to: r.posts.id,
      optional: false,
    }),
    parentComment: r.one.comments({
      from: r.comments.parentId,
      to: r.comments.id,
    }),
    votes: r.many.commentVotes({
      from: r.comments.id,
      to: r.commentVotes.commentId,
    }),
    replies: r.many.comments({
      from: r.comments.id,
      to: r.comments.parentId,
    }),
  },
  users: {
    profile: r.one.profiles({
      from: r.users.profileId,
      to: r.profiles.id,
      optional: false,
    }),
    organizationMemberships: r.many.organizations({
      from: r.users.profileId,
      to: r.organizations.userProfileId,
    }),
    organizationOfficerships: r.many.organizations({
      from: r.users.profileId,
      to: r.organizations.userProfileId,
      where: {
        role: {
          OR: [
            {
              eq: "officer",
            },
            {
              eq: "owner",
            },
          ],
        },
      },
    }),
    organizationOwnerships: r.many.organizations({
      from: r.users.profileId,
      to: r.organizations.userProfileId,
      where: {
        role: {
          eq: "owner",
        },
      },
    }),
  },
  organizations: {
    profile: r.one.profiles({
      from: r.organizations.organizationProfileId,
      to: r.profiles.id,
      optional: false,
    }),
    members: r.many.users({
      from: r.organizations.userProfileId,
      to: r.users.profileId,
    }),
  },
  profiles: {
    posts: r.many.posts({
      from: r.profiles.id,
      to: r.posts.authorId,
    }),
    events: r.many.events({
      from: r.profiles.id,
      to: r.events.organizerId,
    }),
    comments: r.many.comments({
      from: r.profiles.id,
      to: r.comments.authorId,
    }),
    uploadUsage: r.many.uploadUsages({
      from: r.profiles.id,
      to: r.uploadUsages.profileId,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userProfileId,
      to: r.users.profileId,
      optional: false,
    }),
  },
}));

export default relations;
