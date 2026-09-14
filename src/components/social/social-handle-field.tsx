"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bareHandle,
  handleFieldValue,
  SOCIAL,
  socialProfilePublicUrl,
  stripHandleDecorators,
} from "@/lib/social";

function clampCaretAfterAt(el: HTMLInputElement) {
  const start = el.selectionStart ?? 1;
  const end = el.selectionEnd ?? 1;
  if (start < 1 || end < 1) {
    el.setSelectionRange(Math.max(1, start), Math.max(1, end));
  }
}

export function SocialHandleField({
  id,
  name,
  defaultHandle = "",
}: {
  id: string;
  name: string;
  defaultHandle?: string;
}) {
  const [value, setValue] = useState(handleFieldValue(defaultHandle));
  const inputRef = useRef<HTMLInputElement>(null);

  function applyRaw(raw: string) {
    setValue(`@${stripHandleDecorators(raw)}`);
  }

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) clampCaretAfterAt(el);
  }, [value]);

  return (
    <div className="flex flex-col gap-1" data-social-handle-field="">
      <Label htmlFor={id}>{SOCIAL.profile.handle}</Label>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        autoComplete="username"
        value={value}
        placeholder={SOCIAL.profile.handlePlaceholder}
        onChange={(e) => applyRaw(e.target.value)}
        onFocus={(e) => clampCaretAfterAt(e.currentTarget)}
        onClick={(e) => clampCaretAfterAt(e.currentTarget)}
        onSelect={(e) => clampCaretAfterAt(e.currentTarget)}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;
          if (e.key === "Backspace" && start <= 1 && end <= 1) {
            e.preventDefault();
            clampCaretAfterAt(el);
          }
          if (e.key === "ArrowLeft" && start <= 1) {
            e.preventDefault();
            clampCaretAfterAt(el);
          }
          if (e.key === "Home") {
            e.preventDefault();
            el.setSelectionRange(1, 1);
          }
        }}
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
