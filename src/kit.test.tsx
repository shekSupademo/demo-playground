// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  avatarColor,
  daysFromToday,
  formatDate,
  initials,
  money,
  NotificationsMenu,
  relativeTime,
} from "./kit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-26T15:00:00"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("dates", () => {
  it("builds ISO dates relative to today", () => {
    expect(daysFromToday(0)).toBe("2026-11-26");
    expect(daysFromToday(-3)).toBe("2026-11-23");
    expect(daysFromToday(10)).toBe("2026-12-06");
  });

  it("formats a date for display", () => {
    expect(formatDate("2026-12-06")).toBe("Dec 6, 2026");
  });

  it.each([
    [new Date("2026-11-26T14:59:30").toISOString(), "Just now"],
    [new Date("2026-11-26T14:20:00").toISOString(), "40 min ago"],
    [new Date("2026-11-26T10:00:00").toISOString(), "5 h ago"],
    ["2026-11-25", "Yesterday"],
    ["2026-11-20", "6 days ago"],
    ["2026-11-27", "Tomorrow"],
    ["2026-12-01", "In 5 days"],
    ["2026-08-02", "Aug 2, 2026"],
  ])("describes %s as %s", (value, expected) => {
    expect(relativeTime(value)).toBe(expected);
  });
});

describe("money", () => {
  it("formats whole and fractional amounts", () => {
    expect(money(48000)).toBe("$48,000");
    expect(money(68.5)).toBe("$68.50");
    expect(money(1200, "EUR")).toBe("€1,200");
  });
});

describe("avatars", () => {
  it("uses the first and last initials", () => {
    expect(initials("Ava Thompson")).toBe("AT");
    expect(initials("Priya")).toBe("P");
    expect(initials("Mary Jo Lee")).toBe("ML");
  });

  it("picks the same color for the same name", () => {
    expect(avatarColor("Ava Thompson")).toBe(avatarColor("Ava Thompson"));
  });
});

describe("NotificationsMenu", () => {
  const items = [
    {
      id: "1",
      title: "Maya commented on Website relaunch",
      time: "2026-11-26",
      unread: true,
    },
    {
      id: "2",
      title: "Jordan assigned you a task",
      time: "2026-11-25",
      unread: true,
    },
    {
      id: "3",
      title: "Weekly digest is ready",
      time: "2026-11-20",
      unread: false,
    },
  ];

  it("counts unread notifications and clears them", () => {
    render(<NotificationsMenu items={items} />);
    expect(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
  });
});
