import type { PropsWithChildren } from "react";
import { expectSession } from "~/server/auth";
import Permission, { hasPermissions } from "~/server/db/permissions";
import { Provider } from "./CreatePostContext";
import CreatePostDialog from "./CreatePostDialog";

export async function CreatePostProvider({ children }: PropsWithChildren) {
  const session = await expectSession({
    user: {
      with: {
        profile: {
          with: {
            events: true,
            uploads: true,
          },
        },
        organizationMemberships: {
          with: {
            events: true,
          },
        },
        organizationPermissions: {
          with: {
            profile: {
              with: {
                uploads: true,
              },
            },
          },
          where: {
            OR: [
              {
                RAW: hasPermissions("CREATE_POSTS"),
              },
              {
                RAW: hasPermissions("CREATE_EVENTS"),
              },
            ],
          },
        },
      },
    },
  });

  const orgsCanCreatePost = session.user.organizationPermissions
    .filter((org) => (org.permissions & Permission.CREATE_POSTS) !== 0)
    .map((org) => org.profile);

  const orgsCanCreateEvent = session.user.organizationPermissions
    .filter((org) => (org.permissions & Permission.CREATE_EVENTS) !== 0)
    .map((org) => org.profile);

  const events = [
    session.user.profile,
    ...session.user.organizationMemberships,
  ].flatMap((p) => p.events);

  return (
    <Provider>
      {children}

      <CreatePostDialog
        userProfile={session.user.profile}
        orgsCanCreateEvent={orgsCanCreateEvent}
        orgsCanCreatePost={orgsCanCreatePost}
        events={events}
      />
    </Provider>
  );
}

export { useCreatePost } from "./CreatePostContext";
