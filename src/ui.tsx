import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  testId,
  placement = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
  placement?: "center" | "side" | "start";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      data-testid={testId}
      className={cx(placement === "side" ? "my-0 mr-0 ml-auto h-dvh max-h-none" : placement === "start" ? "my-0 ml-0 mr-auto h-dvh max-h-none" : "m-auto", "backdrop:bg-black/40", className)}
      {...({ closedby: "any" } as object)}
    >
      {open && (
        <>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  );
}

export function Menu({
  label,
  trigger,
  items,
  className,
  triggerClassName,
  testId,
}: {
  label: string;
  trigger: ReactNode;
  items: {
    label: string;
    onSelect: () => void;
    danger?: boolean;
    testId?: string;
  }[];
  className?: string;
  triggerClassName?: string;
  testId?: string;
}) {
  const id = useId();
  const anchor = `--menu-${id.replace(/[^a-z0-9]/gi, "")}`;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        popoverTarget={id}
        data-testid={testId}
        className={triggerClassName}
        style={{ anchorName: anchor } as CSSProperties}
      >
        {trigger}
      </button>
      <div
        ref={ref}
        id={id}
        popover="auto"
        role="menu"
        style={
          {
            positionAnchor: anchor,
            positionArea: "bottom span-left",
            margin: 4,
          } as CSSProperties
        }
        className={cx(
          "min-w-44 rounded-lg border border-black/10 bg-white p-1 text-sm text-zinc-800 shadow-lg",
          className,
        )}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            data-testid={item.testId}
            className={cx(
              "block w-full rounded-md px-3 py-2 text-left hover:bg-zinc-100 focus-visible:bg-zinc-100",
              item.danger && "text-rose-600",
            )}
            onClick={() => {
              ref.current?.hidePopover?.();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function useToasts(className = "bg-zinc-900 text-white") {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }].slice(-3));
    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      3500,
    );
  }, []);
  const host = (
    <div
      role="status"
      aria-live="polite"
      data-testid="toasts"
      className="fixed right-4 bottom-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx("rounded-lg px-4 py-3 text-sm shadow-lg", className)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
  return [host, push] as const;
}
