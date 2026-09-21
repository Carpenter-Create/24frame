"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  handleFieldValue,
  SOCIAL,
  socialHandleDisplayError,
  socialProfilePublicUrl,
  stripHandleDecorators,
} from "@/lib/social";
import {
  SOCIAL_HANDLE_FIELD_CLASS,
  SOCIAL_HANDLE_FIELD_LABEL_CLASS,
  SOCIAL_HANDLE_PREFIX_CLASS,
  SOCIAL_PROFILE_EDIT_ERROR_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS,
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_SECTION_CLASS,
} from "@/lib/social-chrome";

function applyHandleRaw(raw: string): string {
  return handleFieldValue(stripHandleDecorators(raw));
}

export function SocialHandleField({
  id,
  name,
  defaultHandle = "",
  value: controlledValue,
  onValueChange,
  label,
  showPreviewUrl = true,
  appearance = "claim",
  error = "",
  placeholder,
}: {
  id: string;
  name?: string;
  defaultHandle?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  showPreviewUrl?: boolean;
  appearance?: "claim" | "edit";
  error?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(handleFieldValue(defaultHandle));
  const value = handleFieldValue(controlledValue ?? draft);
  const fieldLabel = label ?? (appearance === "edit" ? SOCIAL.profile.username : SOCIAL.profile.handle);
  const fieldPlaceholder =
    placeholder ??
    (appearance === "edit" ? SOCIAL.profile.usernamePlaceholder : SOCIAL.profile.handlePlaceholder);
  const notice = error ? socialHandleDisplayError(value, error) : "";

  function applyRaw(raw: string) {
    const next = applyHandleRaw(raw);
    if (controlledValue === undefined) setDraft(next);
    onValueChange?.(next);
  }

  const hostClass =
    appearance === "edit"
      ? notice
        ? SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS
        : SOCIAL_PROFILE_EDIT_HANDLE_CLASS
      : SOCIAL_HANDLE_FIELD_CLASS;

  const field = (
    <div data-social-handle-input="" className={hostClass}>
      <span data-social-handle-prefix="" aria-hidden="true" className={SOCIAL_HANDLE_PREFIX_CLASS}>
        @
      </span>
      <Input
        variant="bare"
        id={id}
        name={name}
        autoComplete="username"
        value={value}
        placeholder={fieldPlaceholder}
        onChange={(e) => applyRaw(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          applyRaw(e.clipboardData.getData("text"));
        }}
        className={cn("flex-1", appearance === "edit" ? "placeholder:text-ink-2" : null)}
      />
    </div>
  );

  if (appearance === "edit") {
    return (
      <div data-social-handle-field="" className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
        <div className="flex items-start gap-3">
          <label htmlFor={id} className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
            {fieldLabel}
          </label>
          {field}
        </div>
        {notice ? (
          <p data-social-handle-required="" className={SOCIAL_PROFILE_EDIT_ERROR_CLASS}>
            {notice}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1" data-social-handle-field="">
      <label htmlFor={id} className={SOCIAL_HANDLE_FIELD_LABEL_CLASS}>
        {fieldLabel}
      </label>
      {field}
      {showPreviewUrl ? (
        <p data-social-handle-url="" className="t-body-sm text-ink-3">
          {socialProfilePublicUrl(value)}
        </p>
      ) : null}
    </div>
  );
}
