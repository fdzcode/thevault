"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { ImageUpload } from "~/components/image-upload";
import { inputClass, labelClass } from "~/lib/constants";

interface ProfileData {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  specialty: string | null;
}

export function ProfileForm({
  initialData,
}: {
  initialData: ProfileData | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState(initialData?.username ?? "");
  const [displayName, setDisplayName] = useState(
    initialData?.displayName ?? "",
  );
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [instagramHandle, setInstagramHandle] = useState(
    initialData?.instagramHandle ?? "",
  );
  const [twitterHandle, setTwitterHandle] = useState(
    initialData?.twitterHandle ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl ?? "");
  const [specialty, setSpecialty] = useState(initialData?.specialty ?? "");

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkUsername = api.profile.checkUsername.useQuery(
    { username },
    {
      enabled: false,
    },
  );

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (username === initialData?.username) {
      setUsernameAvailable(true);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void checkUsername.refetch().then((result) => {
        if (result.data) {
          setUsernameAvailable(result.data.available);
        }
      });
    }, 500);
  }, [username, initialData?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    updateProfile.mutate({
      username,
      displayName: displayName || undefined,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      location: location || undefined,
      instagramHandle: instagramHandle || undefined,
      twitterHandle: twitterHandle || undefined,
      websiteUrl: websiteUrl || undefined,
      specialty: specialty || undefined,
    });
  };

  // Helper to convert single-image upload value (string[] with 0-1 items) to/from string state
  const avatarValue = avatarUrl ? [avatarUrl] : [];
  const bannerValue = bannerUrl ? [bannerUrl] : [];


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className={labelClass}>
          Username *
        </label>
        <input
          id="username"
          required
          minLength={3}
          maxLength={30}
          pattern="^[a-zA-Z0-9_-]+$"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="your_username"
        />
        {username.length >= 3 && usernameAvailable !== null && (
          <p
            className={`mt-1 text-xs ${usernameAvailable ? "text-green-400" : "text-red-400"}`}
          >
            {usernameAvailable ? "Username available" : "Username taken"}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="displayName" className={labelClass}>
          Display Name
        </label>
        <input
          id="displayName"
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
          placeholder="Your Display Name"
        />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          maxLength={500}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputClass}
          placeholder="Tell others about yourself..."
        />
      </div>

      <div>
        <label className={labelClass}>Avatar</label>
        <div className="mt-1">
          <ImageUpload
            value={avatarValue}
            onChange={(urls) => setAvatarUrl(urls[0] ?? "")}
            maxImages={1}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Banner</label>
        <div className="mt-1">
          <ImageUpload
            value={bannerValue}
            onChange={(urls) => setBannerUrl(urls[0] ?? "")}
            maxImages={1}
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input
          id="location"
          maxLength={100}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
          placeholder="City, State"
        />
      </div>

      <div>
        <label htmlFor="specialty" className={labelClass}>
          Specialty
        </label>
        <input
          id="specialty"
          maxLength={100}
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className={inputClass}
          placeholder="e.g. Sneaker customization"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="instagramHandle" className={labelClass}>
            Instagram
          </label>
          <input
            id="instagramHandle"
            maxLength={50}
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            className={inputClass}
            placeholder="@handle"
          />
        </div>
        <div>
          <label htmlFor="twitterHandle" className={labelClass}>
            Twitter / X
          </label>
          <input
            id="twitterHandle"
            maxLength={50}
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            className={inputClass}
            placeholder="@handle"
          />
        </div>
      </div>

      <div>
        <label htmlFor="websiteUrl" className={labelClass}>
          Website
        </label>
        <input
          id="websiteUrl"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={inputClass}
          placeholder="https://yoursite.com"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={updateProfile.isPending}
        className="w-full rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {updateProfile.isPending
          ? "Saving..."
          : initialData
            ? "Update Profile"
            : "Create Profile"}
      </button>

      {updateProfile.isSuccess && (
        <p className="text-sm text-green-400">Profile saved.</p>
      )}
    </form>
  );
}
