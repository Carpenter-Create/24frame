"use client";

import { useState } from "react";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  SOCIAL_PROFILE_EDIT_CARD_CLASS,
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_ROW_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL, socialNameRequiredError } from "@/lib/social";

export function SocialProfileNameFields({
  firstName,
  middleName,
  lastName,
  onFirstName,
  onMiddleName,
  onLastName,
}: {
  firstName: string;
  middleName: string;
  lastName: string;
  onFirstName: (next: string) => void;
  onMiddleName: (next: string) => void;
  onLastName: (next: string) => void;
}) {
  return (
    <div data-social-profile-edit-names="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
      <div className="flex flex-col">
        <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2")}>
          <label htmlFor="social-edit-first-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
            {SOCIAL.profile.firstName}
          </label>
          <Input
            variant="bare"
            id="social-edit-first-name"
            name="first_name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => onFirstName(e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
        <div className="h-px bg-hairline" />
        <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2")}>
          <label htmlFor="social-edit-middle-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
            {SOCIAL.profile.middleName}
          </label>
          <Input
            variant="bare"
            id="social-edit-middle-name"
            name="middle_name"
            autoComplete="additional-name"
            value={middleName}
            onChange={(e) => onMiddleName(e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
        <div className="h-px bg-hairline" />
        <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2")}>
          <label htmlFor="social-edit-last-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
            {SOCIAL.profile.lastName}
          </label>
          <Input
            variant="bare"
            id="social-edit-last-name"
            name="last_name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => onLastName(e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
      </div>
    </div>
  );
}

export function SocialProfileNameEditor({
  firstName,
  middleName,
  lastName,
  onSave,
  onBack,
}: {
  firstName: string;
  middleName: string;
  lastName: string;
  onSave: (next: { firstName: string; middleName: string; lastName: string }) => void;
  onBack: () => void;
}) {
  const [first, setFirst] = useState(firstName);
  const [middle, setMiddle] = useState(middleName);
  const [last, setLast] = useState(lastName);
  const [error, setError] = useState("");

  function onDone() {
    const notice = socialNameRequiredError(first, last);
    if (notice) {
      setError(notice);
      return;
    }
    onSave({ firstName: first, middleName: middle, lastName: last });
    onBack();
  }

  return (
    <SocialProfileEditFace
      face="name"
      title={SOCIAL.profile.name}
      onBack={onBack}
      done={{
        attr: "data-social-profile-name-done",
        onClick: onDone,
      }}
    >
      <SocialProfileNameFields
        firstName={first}
        middleName={middle}
        lastName={last}
        onFirstName={(next) => {
          setFirst(next);
          setError("");
        }}
        onMiddleName={setMiddle}
        onLastName={(next) => {
          setLast(next);
          setError("");
        }}
      />
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </SocialProfileEditFace>
  );
}
