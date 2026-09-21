"use client";

import { useState } from "react";

import { SocialHandleField } from "@/components/social/social-handle-field";
import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { SOCIAL, handleFieldValue, socialHandleDisplayError, socialHandleInputError } from "@/lib/social";

export function SocialProfileHandleEditor({
  value,
  error = "",
  onSave,
  onBack,
}: {
  value: string;
  error?: string;
  onSave: (next: string) => void;
  onBack: () => void;
}) {
  const [username, setUsername] = useState(handleFieldValue(value));
  const [handleError, setHandleError] = useState(error);

  function onDone() {
    const notice = socialHandleInputError(username);
    if (notice) {
      setHandleError(notice);
      return;
    }
    onSave(handleFieldValue(username));
    onBack();
  }

  return (
    <SocialProfileEditFace
      face="handle"
      title={SOCIAL.profile.username}
      onBack={onBack}
      done={{
        attr: "data-social-profile-handle-done",
        onClick: onDone,
      }}
    >
      <div data-social-profile-edit-handle="" className="flex flex-col">
        <SocialHandleField
          id="social-edit-handle"
          name="handle"
          value={username}
          onValueChange={(next) => {
            setUsername(next);
            setHandleError("");
          }}
          appearance="edit"
          showPreviewUrl={false}
          error={handleError ? socialHandleDisplayError(username, handleError) : ""}
        />
      </div>
    </SocialProfileEditFace>
  );
}
