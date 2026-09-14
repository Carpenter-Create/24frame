"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bareHandle,
  handleFieldValue,
  SOCIAL,
  socialProfilePublicUrl,
  stripHandleDecorators,
} from "@/lib/social";

export function SocialHandleField({
  id,
  name,
  defaultHandle = "",
}: {
  id: string;
  name: string;
  defaultHandle?: string;
}) {
  const [value, setValue] = useState(defaultHandle ? handleFieldValue(defaultHandle) : "");

  function applyRaw(raw: string) {
    const next = stripHandleDecorators(raw);
    setValue(next ? `@${next}` : "");
  }

  return (
    <div className="flex flex-col gap-1" data-social-handle-field="">
      <Label htmlFor={id}>{SOCIAL.profile.handle}</Label>
      <Input
        id={id}
        name={name}
        autoComplete="username"
        value={value}
        placeholder={SOCIAL.profile.handlePlaceholder}
        onChange={(e) => applyRaw(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          applyRaw(e.clipboardData.getData("text"));
        }}
      />
      <p data-social-handle-url="" className="t-body-sm text-ink-3">
        {socialProfilePublicUrl(bareHandle(value))}
      </p>
    </div>
  );
}
