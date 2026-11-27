import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Briefcase,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  Coffee,
  MapPin,
  Plane,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

type StepId =
  | "purpose"
  | "company"
  | "destination"
  | "dates"
  | "guests"
  | "room"
  | "guestsRoom"
  | "extras"
  | "review";
type RoomId = "standard" | "deluxe" | "suite";
type Booking = {
  purpose: "leisure" | "business";
  company: string;
  vat: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  room: RoomId;
  extras: string[];
};

const stepMeta: Record<StepId, { title: string; Icon: typeof MapPin }> = {
  purpose: { title: "Trip purpose", Icon: Sun },
  company: { title: "Company details", Icon: Building2 },
  destination: { title: "Destination", Icon: MapPin },
  dates: { title: "Dates", Icon: CalendarDays },
  guests: { title: "Guests", Icon: Users },
  room: { title: "Room", Icon: BedDouble },
  guestsRoom: { title: "Guests and room", Icon: Users },
  extras: { title: "Extras", Icon: Sparkles },
  review: { title: "Review", Icon: ClipboardCheck },
};

const destinations = [
  { id: "lisbon", name: "Lisbon, Portugal", hotel: "Casa do Rio Hotel" },
  { id: "kyoto", name: "Kyoto, Japan", hotel: "Higashiyama Garden Inn" },
  { id: "capetown", name: "Cape Town, South Africa", hotel: "Bay View Lodge" },
  { id: "vancouver", name: "Vancouver, Canada", hotel: "Harbourfront Suites" },
];

const rooms: { id: RoomId; name: string; detail: string; price: number }[] = [
  {
    id: "standard",
    name: "Standard",
    detail: "Queen bed, city view",
    price: 140,
  },
  { id: "deluxe", name: "Deluxe", detail: "King bed, balcony", price: 210 },
  { id: "suite", name: "Suite", detail: "Separate living room", price: 340 },
];

const extras = [
  { id: "breakfast", name: "Breakfast buffet", price: 24, perNight: true },
  { id: "transfer", name: "Airport transfer", price: 45, perNight: false },
  { id: "late", name: "Late checkout (2 PM)", price: 30, perNight: false },
];

const nightsOf = (b: Booking) =>
  Math.max(
    0,
    Math.round((Date.parse(b.checkOut) - Date.parse(b.checkIn)) / 86_400_000),
  );

function totalOf(b: Booking) {
  const nights = nightsOf(b);
  const room = rooms.find((r) => r.id === b.room)?.price ?? 0;
  const add = extras
    .filter((e) => b.extras.includes(e.id))
    .reduce((sum, e) => sum + (e.perNight ? e.price * nights : e.price), 0);
  return room * nights + add;
}

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const inputClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none";
const primary =
  "inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-40";
const secondary =
  "inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-stone-100 disabled:opacity-40";

function Choice({
  name,
  checked,
  onChange,
  testId,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4",
        checked
          ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
          : "border-stone-200 bg-white hover:border-stone-300",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-orange-600"
        data-testid={testId}
      />
      {children}
    </label>
  );
}

function GuestsField({
  b,
  set,
}: {
  b: Booking;
  set: (patch: Partial<Booking>) => void;
}) {
  return (
    <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
      Number of guests
      <input
        type="number"
        min={1}
        max={6}
        value={b.guests}
        onChange={(e) =>
          set({ guests: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })
        }
        className={inputClass}
        data-testid="guests"
      />
    </label>
  );
}

function RoomField({
  b,
  set,
}: {
  b: Booking;
  set: (patch: Partial<Booking>) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Room type</legend>
      {rooms.map((r) => (
        <Choice
          key={r.id}
          name="room"
          checked={b.room === r.id}
          onChange={() => set({ room: r.id })}
          testId={`room-${r.id}`}
        >
          <BedDouble className="size-5 text-orange-600" aria-hidden />
          <span className="flex-1">
            <span className="block font-medium">{r.name}</span>
            <span className="text-sm text-stone-500">{r.detail}</span>
          </span>
          <span className="text-sm font-semibold">{money(r.price)}/night</span>
        </Choice>
      ))}
    </fieldset>
  );
}

function StepBody({
  step,
  b,
  set,
}: {
  step: StepId;
  b: Booking;
  set: (patch: Partial<Booking>) => void;
}) {
  switch (step) {
    case "purpose":
      return (
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">
            What brings you there?
          </legend>
          <Choice
            name="purpose"
            checked={b.purpose === "leisure"}
            onChange={() => set({ purpose: "leisure" })}
            testId="purpose-leisure"
          >
            <Sun className="size-5 text-orange-600" aria-hidden />
            <span className="font-medium">Leisure</span>
          </Choice>
          <Choice
            name="purpose"
            checked={b.purpose === "business"}
            onChange={() => set({ purpose: "business" })}
            testId="purpose-business"
          >
            <Briefcase className="size-5 text-orange-600" aria-hidden />
            <span className="font-medium">Business</span>
          </Choice>
        </fieldset>
      );
    case "company":
      return (
        <div className="flex max-w-md flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Company name
            <input
              value={b.company}
              onChange={(e) => set({ company: e.target.value })}
              placeholder="Northwind Traders"
              className={inputClass}
              data-testid="company-name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            VAT or tax ID (optional)
            <input
              value={b.vat}
              onChange={(e) => set({ vat: e.target.value })}
              className={inputClass}
              data-testid="company-vat"
            />
          </label>
        </div>
      );
    case "destination":
      return (
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">Where to?</legend>
          {destinations.map((d) => (
            <Choice
              key={d.id}
              name="destination"
              checked={b.destination === d.id}
              onChange={() => set({ destination: d.id })}
              testId={`destination-${d.id}`}
            >
              <MapPin className="size-5 text-orange-600" aria-hidden />
              <span>
                <span className="block font-medium">{d.name}</span>
                <span className="text-sm text-stone-500">{d.hotel}</span>
              </span>
            </Choice>
          ))}
        </fieldset>
      );
    case "dates":
      return (
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Check-in
            <input
              type="date"
              value={b.checkIn}
              onChange={(e) => set({ checkIn: e.target.value })}
              className={inputClass}
              data-testid="check-in"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Check-out
            <input
              type="date"
              value={b.checkOut}
              min={b.checkIn}
              onChange={(e) => set({ checkOut: e.target.value })}
              className={inputClass}
              data-testid="check-out"
            />
          </label>
          <p className="w-full text-sm text-stone-500">
            {nightsOf(b) > 0
              ? `${nightsOf(b)} nights`
              : "Check-out must be after check-in"}
          </p>
        </div>
      );
    case "guests":
      return <GuestsField b={b} set={set} />;
    case "room":
      return <RoomField b={b} set={set} />;
    case "guestsRoom":
      return (
        <div className="flex flex-col gap-6">
          <GuestsField b={b} set={set} />
          <RoomField b={b} set={set} />
        </div>
      );
    case "extras":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            Make your stay better
          </legend>
          {extras.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white p-4"
            >
              <input
                type="checkbox"
                checked={b.extras.includes(e.id)}
                onChange={() =>
                  set({
                    extras: b.extras.includes(e.id)
                      ? b.extras.filter((x) => x !== e.id)
                      : [...b.extras, e.id],
                  })
                }
                className="accent-orange-600"
                data-testid={`extra-${e.id}`}
              />
              <Coffee className="size-5 text-orange-600" aria-hidden />
              <span className="flex-1 font-medium">{e.name}</span>
              <span className="text-sm text-stone-500">
                {money(e.price)}
                {e.perNight ? "/night" : ""}
              </span>
            </label>
          ))}
        </fieldset>
      );
    case "review": {
      const dest = destinations.find((d) => d.id === b.destination);
      const room = rooms.find((r) => r.id === b.room);
      const rows: [string, string][] = [
        ...(b.purpose === "business"
          ? ([["Company", b.company]] as [string, string][])
          : []),
        ["Hotel", `${dest?.hotel}, ${dest?.name}`],
        ["Dates", `${b.checkIn} to ${b.checkOut} (${nightsOf(b)} nights)`],
        ["Guests", String(b.guests)],
        ["Room", room?.name ?? ""],
        ...(b.extras.length
          ? ([
              [
                "Extras",
                extras
                  .filter((e) => b.extras.includes(e.id))
                  .map((e) => e.name)
                  .join(", "),
              ],
            ] as [string, string][])
          : []),
      ];
      return (
        <dl
          className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm"
          data-testid="summary"
        >
          {rows.map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-stone-500">{k}</dt>
              <dd className="text-right font-medium">{val}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 bg-orange-50 px-4 py-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold" data-testid="total">
              {money(totalOf(b))}
            </dd>
          </div>
        </dl>
      );
    }
  }
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const initial: Booking = {
    purpose: "leisure",
    company: "",
    vat: "",
    destination: "lisbon",
    checkIn: "2026-12-18",
    checkOut: "2026-12-21",
    guests: v ? 2 : 1,
    room: v ? "deluxe" : "standard",
    extras: [],
  };
  const [booking, setBooking] = useState(initial);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  const [toasts, toast] = useToasts("bg-stone-900 text-white");

  const set = (patch: Partial<Booking>) =>
    setBooking((cur) => ({ ...cur, ...patch }));
  const steps: StepId[] = v
    ? [
        "purpose",
        ...(booking.purpose === "business" ? (["company"] as const) : []),
        "dates",
        "destination",
        "guestsRoom",
        "review",
      ]
    : ["destination", "dates", "guests", "room", "extras", "review"];
  const step = steps[Math.min(index, steps.length - 1)];
  const canNext =
    (step !== "company" || booking.company.trim() !== "") &&
    (step !== "dates" || nightsOf(booking) > 0);

  const book = () => {
    setConfirming(false);
    setCode("TW-48213");
    toast("Booking confirmed");
  };
  const restart = () => {
    setBooking(initial);
    setIndex(0);
    setCode("");
  };
  const { title, Icon } = stepMeta[step];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4 font-semibold">
          <span
            className="grid size-8 place-items-center rounded-full bg-orange-600 text-white"
            data-testid="logo"
          >
            <Plane className="size-4" aria-hidden />
          </span>
          Tripway
          <span className="ml-auto text-sm font-normal text-stone-500">
            Hotels, made simple
          </span>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {code ? (
          <section
            className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-10 text-center animate-fade-up"
            data-testid="booked"
          >
            <CircleCheck className="size-12 text-emerald-600" aria-hidden />
            <h1 className="text-2xl font-semibold">Your stay is booked</h1>
            <p className="text-stone-500">
              Confirmation{" "}
              <span className="font-mono font-semibold text-stone-900">
                {code}
              </span>
              . We sent the details to alex.morgan@example.com.
            </p>
            <p className="text-lg font-semibold">{money(totalOf(booking))}</p>
            <button
              type="button"
              className={secondary}
              onClick={restart}
              data-testid="new-booking"
            >
              Plan another stay
            </button>
          </section>
        ) : (
          <>
            <nav aria-label="Booking steps" data-testid="step-indicator">
              <p className="text-sm font-medium text-orange-700">
                Step {steps.indexOf(step) + 1} of {steps.length}
              </p>
              <ol className="mt-2 flex gap-1.5">
                {steps.map((s, i) => (
                  <li
                    key={s}
                    aria-current={s === step ? "step" : undefined}
                    title={stepMeta[s].title}
                    className={cx(
                      "h-1.5 flex-1 rounded-full",
                      i <= steps.indexOf(step)
                        ? "bg-orange-500"
                        : "bg-stone-200",
                    )}
                  >
                    <span className="sr-only">{stepMeta[s].title}</span>
                  </li>
                ))}
              </ol>
            </nav>
            <section className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6">
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <Icon className="size-6 text-orange-600" aria-hidden />
                {title}
              </h1>
              <StepBody step={step} b={booking} set={set} />
            </section>
            <div className="flex justify-between">
              <button
                type="button"
                className={secondary}
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                data-testid="prev-step"
              >
                <ArrowLeft className="size-4" aria-hidden /> Back
              </button>
              {step === "review" ? (
                <button
                  type="button"
                  className={primary}
                  onClick={() => (v ? book() : setConfirming(true))}
                  data-testid="book-now"
                >
                  Book now · {money(totalOf(booking))}
                </button>
              ) : (
                <button
                  type="button"
                  className={primary}
                  disabled={!canNext}
                  onClick={() => setIndex((i) => i + 1)}
                  data-testid="next-step"
                >
                  Next <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </>
        )}
      </main>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirm your booking"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-stone-900 shadow-xl"
        testId="confirm-dialog"
      >
        <p className="mt-2 text-sm text-stone-600">
          You'll be charged {money(totalOf(booking))} for {nightsOf(booking)}{" "}
          nights. Free cancellation until 48 hours before check-in.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className={secondary}
            onClick={() => setConfirming(false)}
            data-testid="cancel-booking"
          >
            Cancel
          </button>
          <button
            type="button"
            className={primary}
            onClick={book}
            data-testid="confirm-booking"
          >
            Confirm booking
          </button>
        </div>
      </Dialog>
      {toasts}
    </div>
  );
}
