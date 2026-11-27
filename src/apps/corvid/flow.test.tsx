// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

beforeEach(() => {
  window.location.hash = "#/";
});

afterEach(cleanup);

const click = (id: string) => fireEvent.click(screen.getByTestId(id));
const type = (id: string, value: string) =>
  fireEvent.change(screen.getByTestId(id), { target: { value } });
const lastMonth = (() => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const toasts = () => screen.getByTestId("toasts").textContent;

describe.each(["baseline", "variant"] as const)("corvid %s", (variant) => {
  const v = variant === "variant";

  it("keeps every feature off Home and the sidebar", () => {
    render(<App variant={variant} />);
    for (const id of [
      "reset-2fa",
      "edit-limit",
      "rotate-key",
      "add-domain",
      "download-invoice",
    ])
      expect(screen.queryByTestId(id)).toBeNull();
  });

  it("resets a member's 2-step verification", () => {
    render(<App variant={variant} />);
    click("nav-people");
    click("hub-teams");
    click("team-engineering");
    click("member-maya-chen");
    click("tab-security");
    expect(screen.getByTestId("tab-security").textContent).toBe(
      v ? "Sign-in and security" : "Security",
    );
    expect(screen.queryByTestId("reset-2fa") !== null).toBe(!v);
    if (v) click("menu-reset-2fa");
    else click("reset-2fa");
    click("confirm-reset-2fa");
    expect(toasts()).toContain("2-step verification reset for Maya Chen");
    expect(screen.getByTestId("twofa-status").textContent).toContain(
      "Not enrolled",
    );
  });

  it("raises a team's storage limit", () => {
    render(<App variant={variant} />);
    if (v) {
      click("nav-people");
      click("hub-teams");
      click("team-design");
      click("tab-settings");
      expect(screen.queryByTestId("settings-storage")).toBeNull();
      click("nav-organization");
      click("hub-storage");
      click("edit-limit-design");
    } else {
      click("nav-organization");
      expect(screen.queryByTestId("hub-storage")).toBeNull();
      click("nav-people");
      click("hub-teams");
      click("team-design");
      click("tab-settings");
      click("settings-storage");
      click("edit-limit");
    }
    type("storage-limit", "750");
    click("save-limit");
    expect(toasts()).toContain("Storage limit updated");
    expect(screen.getByTestId("limit-design").textContent).toContain("750 GB");
  });

  it("rotates an API key", () => {
    render(<App variant={variant} />);
    click("nav-developers");
    click("hub-apps");
    click("app-billing-sync");
    click("tab-credentials");
    if (v) click("manage-keys");
    click("key-production");
    const before = screen.getByTestId("key-suffix").textContent;
    click("rotate-key");
    if (v) {
      expect(
        (screen.getByTestId("confirm-rotate") as HTMLButtonElement).disabled,
      ).toBe(true);
      type("confirm-key-name", "Production key");
    }
    click("confirm-rotate");
    expect(toasts()).toContain("Production key rotated");
    expect(screen.getByTestId("key-suffix").textContent).not.toBe(before);
  });

  it("allows a new sign-in domain", () => {
    render(<App variant={variant} />);
    click("nav-security");
    click("hub-policies");
    if (v) {
      expect(screen.queryByTestId("policy-sign-in")).toBeNull();
      click("policy-authentication");
      click("section-domains");
    } else {
      click("policy-sign-in");
      click("tab-domains");
    }
    click("add-domain");
    click("save-domain");
    expect(screen.getByText("Enter a domain like example.com")).toBeTruthy();
    type("domain-input", "halden-labs.io");
    click("save-domain");
    expect(toasts()).toContain("halden-labs.io added");
    expect(screen.getByTestId("domain-list").textContent).toContain(
      "halden-labs.io",
    );
  });

  it("downloads last month's invoice", () => {
    render(<App variant={variant} />);
    click("nav-billing");
    if (v) {
      expect(screen.queryByTestId("hub-subscriptions")).not.toBeNull();
      click("hub-history");
      click(`download-invoice-${lastMonth}`);
    } else {
      expect(screen.queryByTestId("hub-history")).toBeNull();
      click("hub-subscriptions");
      click("subscription-business");
      click("tab-invoices");
      click(`invoice-${lastMonth}`);
      click("download-invoice");
    }
    expect(toasts()).toContain(`Invoice INV-${lastMonth} downloaded`);
  });
});
