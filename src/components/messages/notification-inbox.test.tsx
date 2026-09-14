import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/messages/mark-all-read", () => ({
  MarkAllRead: () => <button type="button">Mark all read</button>,
}));
vi.mock("@/app/(app)/messages/mark-read", () => ({
  MarkRead: () => <button type="button">Mark as read</button>,
}));
vi.mock("@/app/(app)/messages/message-link", () => ({
  MessageLink: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { NotificationInbox } from "./notification-inbox";

const READ = {
  id: "n1",
  org_id: "org-1",
  kind: "title_rejected" as const,
  title: "Returned",
  body: "Fix chain of title",
  source_refs: {},
  created_at: "2026-09-01T00:00:00.000Z",
  unread: false,
};

describe("NotificationInbox mark all", () => {
  it("still offers Mark all when the visible page is all read but the list overflowed", () => {
    const html = renderToStaticMarkup(
      <NotificationInbox notifications={[READ]} truncated />,
    );
    expect(html).toContain("Mark all read");
  });

  it("hides Mark all when every loaded row is read and the list is complete", () => {
    const html = renderToStaticMarkup(
      <NotificationInbox notifications={[READ]} truncated={false} />,
    );
    expect(html).not.toContain("Mark all read");
  });
});
