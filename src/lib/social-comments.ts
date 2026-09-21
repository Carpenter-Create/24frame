import { z } from "zod";

import { SOCIAL } from "@/lib/social";

// Comments v1 parse / insert helpers. Write path lives in light-actions.
// Like-on-comment, replies, edit, and @mentions stay out of this slice.

export const COMMENT_BODY_MAX = 500;
export const COMMENT_SNIPPET_MAX = 180;

const commentBodySchema = z
  .string()
  .trim()
  .min(1)
  .max(COMMENT_BODY_MAX);

export function normalizeCommentBody(raw: string): string | null {
  const parsed = commentBodySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function commentBodyError(raw: string): string {
  const body = raw.trim();
  if (!body) return SOCIAL.post.commentMissing;
  if (body.length > COMMENT_BODY_MAX) return SOCIAL.post.commentTooLong;
  return SOCIAL.post.commentFailed;
}

export function commentInsertRow(input: {
  postId: string;
  authorId: string;
  body: string;
}) {
  return {
    post_id: input.postId,
    author_id: input.authorId,
    body: input.body,
  };
}

/** Calm UI snippet. Full body stays on the row. Word-boundary cut only. */
export function socialCommentSnippet(body: string, max = COMMENT_SNIPPET_MAX): string {
  const text = body.trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const atWord = slice.lastIndexOf(" ");
  const calm = (atWord >= Math.floor(max * 0.6) ? slice.slice(0, atWord) : slice).trimEnd();
  return `${calm}…`;
}

export type SocialCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type SocialCommentCard = SocialCommentRow & {
  authorHandle: string | null;
  authorName: string;
  authorPhotoUrl: string | null;
  canDelete: boolean;
};
