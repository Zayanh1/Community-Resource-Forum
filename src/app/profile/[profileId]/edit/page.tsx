import Link from "next/link";
import { notFound } from "next/navigation";
import UploadProfilePhoto from "~/components/UploadProfilePhoto";
import FileUploadForm from "~/components/FileUploadForm";
import editProfile from "~/server/actions/editProfile";
import { expectSession } from "~/server/auth";

//This is the form field page where users are redirected to to edit their profiles.

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const session = await expectSession({
    user: {
      with: {
        profile: {
          with: {
            events: true,
          },
        },
        organizationOwnerships: {
          with: {
            profile: true,
          },
        },
      },
    },
  });
  const { profileId } = await params;

  const profile =
    session &&
    (profileId === session.userProfileId
      ? session.user.profile
      : session.user.organizationOwnerships.find(
          (org) => org.organizationProfileId === profileId,
        )?.profile);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit Profile</h1>
      <FileUploadForm
        action={editProfile}
        fileInputs={{
          image: { ownerId: profileId, tag: "profileImage" },
        }}
        className="space-y-4"
      >
        <input type="hidden" name="id" defaultValue={profile.id} />
        <div>
          <label className="block text-sm font-medium">
            Replace Profile Photo
          </label>
          <label className="flex items-center gap-4 rounded-md border border-zinc-300 bg-white px-2 py-2 shadow-xs transition-[border-color,box-shadow] hover:border-zinc-400 hover:shadow-sm">
            {/* <span className="text-5xl/0">
              <Avatar {...profile} image={state?.status === "success" ? `/_uploads/${state?.data.uploadId}` : profile.image} />
            </span> */}
            <input name="image" type="file" />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            defaultValue={profile.name}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={5}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">LinkedIn</label>
          <input
            name="linkedin"
            defaultValue={profile.linkedin ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GitHub</label>
          <input
            name="github"
            defaultValue={profile.github ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Personal Site</label>
          <input
            name="personalSite"
            defaultValue={profile.personalSite ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-sky-700 px-4 py-2 text-white hover:bg-sky-600"
          >
            Save
          </button>
          <Link
            href={`/profile/${profileId}`}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </FileUploadForm>
    </div>
  );
}
