"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AccountAvatarCrop } from "@/components/account/account-avatar-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import {
  ACCOUNT_NAME_MAX,
  ACCOUNT_PHOTO_CIRCLE_CLASS,
  ACCOUNT_PHOTO_DROPPING_CLASS,
  ACCOUNT_PROFILE,
} from "@/lib/account-profile";
import {
  accountAvatarPickError,
  cropAvatarFile,
  readAccountAvatarCropPreview,
  type AvatarCropFrame,
} from "@/lib/account-avatar-crop";
import { AVATAR_ACCEPT } from "@/lib/account-avatar";
import { cn } from "@/lib/cn";
import { saveAccountName, uploadAccountPhoto } from "./actions";

// Name writes user_metadata.display_name. Email is the session login email
// and is not changed here (auth gate). Photo PUTs to the dedicated avatars
// bucket under avatars/{user-id}/avatar — not the title bucket.
// AccountNameForm is the SoT mutate body — desktop Profile and the
// mobile Name drill-in pane share it.

export function AccountPhotoField({ photoUrl }: { photoUrl: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dropping, setDropping] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);

  function clearCrop() {
    if (cropPreview) URL.revokeObjectURL(cropPreview);
    setCropFile(null);
    setCropPreview(null);
    setCropSize(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function beginCrop(file: File | undefined) {
    const pickError = accountAvatarPickError(file);
    if (!file) return;
    setError("");
    if (pickError) {
      setError(pickError);
      return;
    }
    void readAccountAvatarCropPreview(file)
      .then((next) => {
        if (cropPreview) URL.revokeObjectURL(cropPreview);
        setCropFile(file);
        setCropPreview(next.url);
        setCropSize({ width: next.width, height: next.height });
      })
      .catch((cause) => {
        setError(cause instanceof Error && cause.message ? cause.message : ACCOUNT_PROFILE.photoType);
      });
  }

  async function onCropConfirm(frame: AvatarCropFrame) {
    if (!cropFile) return;
    setUploading(true);
    setError("");
    try {
      const cropped = await cropAvatarFile(cropFile, frame);
      const body = new FormData();
      body.set("photo", cropped);
      const res = await uploadAccountPhoto(body);
      if (res.error) {
        setError(res.error);
        return;
      }
      clearCrop();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : ACCOUNT_PROFILE.photoFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-2)]" data-account-photo="">
      {cropFile && cropPreview && cropSize ? (
        <AccountAvatarCrop
          key={cropPreview}
          previewUrl={cropPreview}
          imageWidth={cropSize.width}
          imageHeight={cropSize.height}
          pending={uploading}
          onCancel={clearCrop}
          onConfirm={(frame) => void onCropConfirm(frame)}
        />
      ) : (
        <div className="flex items-center gap-[var(--space-2)]">
          <button
            type="button"
            data-account-photo-circle=""
            data-account-photo-drop=""
            data-dropping={dropping ? "" : undefined}
            aria-label={dropping ? ACCOUNT_PROFILE.dropPhoto : ACCOUNT_PROFILE.uploadPhoto}
            className={cn(
              ACCOUNT_PHOTO_CIRCLE_CLASS,
              dropping ? ACCOUNT_PHOTO_DROPPING_CLASS : null,
            )}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDropping(false);
              beginCrop(event.dataTransfer.files[0]);
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
              <img src={photoUrl} alt={ACCOUNT_PROFILE.photoAlt} className="size-full object-cover" />
            ) : null}
          </button>
          <button
            type="button"
            className={TEXT_ACTION_CLASS}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {dropping
              ? ACCOUNT_PROFILE.dropPhoto
              : uploading
                ? ACCOUNT_PROFILE.uploadingPhoto
                : ACCOUNT_PROFILE.uploadPhoto}
          </button>
          <input
            ref={fileRef}
            id="account-photo"
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            aria-label={ACCOUNT_PROFILE.uploadPhoto}
            onChange={(e) => beginCrop(e.target.files?.[0])}
          />
        </div>
      )}
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </div>
  );
}

export function AccountNameForm({
  name,
  labeled = true,
}: {
  name: string;
  labeled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await saveAccountName(value);
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    form.querySelector<HTMLInputElement>("#account-name")?.blur();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-[var(--space-4)]"
      data-account-name-form=""
    >
      <div className="flex flex-col gap-[var(--space-2)]">
        {labeled ? <Label htmlFor="account-name">{ACCOUNT_PROFILE.nameLabel}</Label> : null}
        <Input
          id="account-name"
          name="name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          maxLength={ACCOUNT_NAME_MAX}
          autoComplete="name"
        />
      </div>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? ACCOUNT_PROFILE.saving : ACCOUNT_PROFILE.save}
      </Button>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {saved ? <InlineNotice>{ACCOUNT_PROFILE.saved}</InlineNotice> : null}
    </form>
  );
}

export function AccountEmailField({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]" data-account-email="">
      <Label htmlFor="account-email">{ACCOUNT_PROFILE.emailLabel}</Label>
      <Input
        id="account-email"
        name="email"
        type="email"
        value={email}
        readOnly
        aria-readonly="true"
      />
      <p className="t-body-sm text-ink-3">{ACCOUNT_PROFILE.emailHint}</p>
    </div>
  );
}

export function AccountProfileForm({
  name,
  email,
  photoUrl,
}: {
  name: string;
  email: string;
  photoUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)]" data-account-profile-form="">
      <AccountPhotoField photoUrl={photoUrl} />
      <AccountNameForm name={name} />
      <AccountEmailField email={email} />
    </div>
  );
}
