import {
  ArrowLeft,
  BedDouble,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Clock,
  type LucideIcon,
  MapPin,
  Minus,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Users,
} from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
  daysFromToday,
  formatDate,
  MobileNav,
  money,
  type Notification,
  NotificationsMenu,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";
import {
  type Booking,
  destinations,
  extras,
  type Hotel,
  hotelOf,
  initialBooking,
  priceOf,
  roomRate,
  rooms,
  type Scene,
  type StepId,
  stepsFor,
  TAX_RATE,
} from "./booking";

const font = { fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" };
const navy = "bg-[#1E3A8A]";
const navyText = "text-[#1E3A8A]";
const page = "bg-[#F6F7FB]";
const line = "border-[#E3E7F0]";
const muted = "text-slate-500";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]";
const inputClass = cx(
  "h-11 rounded-lg border bg-white px-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20",
  line,
);
const primary = cx(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-6 text-sm font-semibold text-slate-950 shadow-sm hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
);
const secondary = cx(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40",
  line,
  focusRing,
);
const panel = cx("rounded-2xl border bg-white", line);

const stepMeta: Record<
  StepId,
  { title: string; lead: string; Icon: LucideIcon }
> = {
  purpose: {
    title: "Trip purpose",
    lead: "Tell us why you're travelling so we can tailor your stay.",
    Icon: Sun,
  },
  company: {
    title: "Company details",
    lead: "We'll put these on your invoice.",
    Icon: Building2,
  },
  destination: {
    title: "Destination",
    lead: "Hand-picked stays with verified guest reviews.",
    Icon: MapPin,
  },
  dates: {
    title: "Dates",
    lead: "Check-in from 3 PM, check-out by 11 AM.",
    Icon: CalendarDays,
  },
  guests: {
    title: "Guests",
    lead: "Up to 6 guests per booking.",
    Icon: Users,
  },
  room: {
    title: "Room",
    lead: "Prices are per night for the whole room.",
    Icon: BedDouble,
  },
  guestsRoom: {
    title: "Guests and room",
    lead: "Choose who's coming and where you'll sleep.",
    Icon: Users,
  },
  extras: {
    title: "Extras",
    lead: "Add anything you'd like waiting for you.",
    Icon: Sparkles,
  },
  review: {
    title: "Review",
    lead: "Check the details before you book.",
    Icon: ClipboardCheck,
  },
};

const notifications: Notification[] = [
  {
    id: "n1",
    title: "Prices for Kyoto in January dropped by 14%",
    time: daysFromToday(0),
    unread: true,
  },
  {
    id: "n2",
    title: "Casa do Rio Hotel has 3 rooms left for your dates",
    time: daysFromToday(-1),
    unread: true,
  },
  {
    id: "n3",
    title: "You earned 420 Tripway points on your Porto stay",
    time: daysFromToday(-4),
    unread: false,
  },
  {
    id: "n4",
    title: "Rate your stay at Harbourfront Suites",
    time: daysFromToday(-9),
    unread: false,
  },
  {
    id: "n5",
    title: "Your saved list Winter sun has 2 new stays",
    time: daysFromToday(-16),
    unread: false,
  },
];

const ratingWord = (r: number) =>
  r >= 9 ? "Exceptional" : r >= 8.5 ? "Excellent" : "Very good";
const fmtShort = (iso: string) =>
  !iso || Number.isNaN(Date.parse(iso))
    ? "Add a date"
    : new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
const nightsLabel = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;
const guestsLabel = (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`;

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#1E3A8A" />
      <path
        d="M8 22c3-8 6-11 9-11s4 3 7 3"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="14" r="3.2" fill="#F59E0B" />
      <circle cx="8" cy="22" r="1.8" fill="#fff" />
    </svg>
  );
}

const scenePalette: Record<
  Scene,
  { sky: string; far: string; near: string; accent: string; ground: string }
> = {
  river: {
    sky: "#FDE6C8",
    far: "#F2B880",
    near: "#C8553D",
    accent: "#F59E0B",
    ground: "#4A7FB5",
  },
  temple: {
    sky: "#FBE3E8",
    far: "#E9A6B4",
    near: "#7A2E3A",
    accent: "#E85D75",
    ground: "#5B7553",
  },
  mountain: {
    sky: "#D7ECF7",
    far: "#8FB3C9",
    near: "#3F5E73",
    accent: "#FCD34D",
    ground: "#2B8BB8",
  },
  harbour: {
    sky: "#DCE7F7",
    far: "#9DB4D8",
    near: "#1E3A8A",
    accent: "#F8FAFC",
    ground: "#2D5DA8",
  },
  beach: {
    sky: "#CDEFF5",
    far: "#F6D9A8",
    near: "#E07A3F",
    accent: "#FDBA2D",
    ground: "#1FA2B8",
  },
  aurora: {
    sky: "#1B2440",
    far: "#3BC9A0",
    near: "#0E1428",
    accent: "#F5F3FF",
    ground: "#2A3A66",
  },
};

function HotelArt({ scene, className }: { scene: Scene; className?: string }) {
  const p = scenePalette[scene];
  return (
    <svg
      viewBox="0 0 240 160"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <rect width="240" height="160" fill={p.sky} />
      {scene === "aurora" ? (
        <>
          <path
            d="M0 52c40-30 80 10 120-12s80-20 120 0v20c-40-14-80 8-120 18S40 64 0 80z"
            fill={p.far}
            opacity="0.7"
          />
          <circle cx="190" cy="28" r="10" fill={p.accent} />
        </>
      ) : (
        <circle cx="186" cy="38" r="16" fill={p.accent} />
      )}
      {scene === "mountain" && (
        <path d="M0 112 L60 46 L96 80 L132 30 L240 112 Z" fill={p.far} />
      )}
      {scene === "temple" && (
        <g fill={p.near}>
          <rect x="150" y="62" width="40" height="50" />
          <path d="M138 66 L170 46 L202 66 Z" />
          <path d="M144 86 L170 72 L196 86 Z" />
          <rect x="166" y="30" width="8" height="18" />
        </g>
      )}
      <g fill={scene === "aurora" ? "#24315A" : p.far}>
        <rect x="18" y="70" width="34" height="50" rx="2" />
        <rect x="58" y="54" width="26" height="66" rx="2" />
        <rect x="200" y="78" width="30" height="42" rx="2" />
      </g>
      <g fill={p.near}>
        <rect x="88" y="44" width="56" height="78" rx="3" />
        <path d="M84 48 L116 30 L148 48 Z" />
      </g>
      <g fill={p.accent} opacity="0.9">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={96 + col * 16}
              y={56 + row * 15}
              width="9"
              height="8"
              rx="1"
            />
          )),
        )}
      </g>
      <path
        d="M0 120 C40 112 80 128 120 120 S200 112 240 122 V160 H0 Z"
        fill={p.ground}
      />
      <path
        d="M20 138 h40 M90 146 h52 M170 136 h44"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${count}-star hotel`}>
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          className="size-3.5 fill-[#F59E0B] text-[#F59E0B]"
          aria-hidden
        />
      ))}
    </span>
  );
}

function RatingPill({ hotel }: { hotel: Hotel }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cx(
          "rounded-md px-1.5 py-0.5 text-sm font-semibold text-white tabular-nums",
          navy,
        )}
      >
        {hotel.rating.toFixed(1)}
      </span>
      <span className="text-sm">
        <span className="font-medium text-slate-900">
          {ratingWord(hotel.rating)}
        </span>{" "}
        <span className={cx(muted, "tabular-nums")}>
          {hotel.reviews.toLocaleString("en-US")} reviews
        </span>
      </span>
    </span>
  );
}

function Choice({
  name,
  checked,
  onChange,
  testId,
  children,
  className,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  testId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cx(
        "relative flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1E3A8A]/40",
        checked
          ? "border-[#1E3A8A] bg-[#EEF2FB] ring-1 ring-[#1E3A8A]"
          : cx(line, "bg-white hover:border-slate-300"),
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 shrink-0 accent-[#1E3A8A] focus:outline-none"
        data-testid={testId}
      />
      {children}
    </label>
  );
}

type FieldProps = { b: Booking; set: (patch: Partial<Booking>) => void };

function GuestsField({ b, set }: FieldProps) {
  const id = useId();
  const clamp = (n: number) => Math.min(6, Math.max(1, n));
  const stepBtn = cx(
    "grid size-11 place-items-center rounded-lg border bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40",
    line,
    focusRing,
  );
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        Number of guests
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Remove a guest"
          className={stepBtn}
          disabled={b.guests <= 1}
          onClick={() => set({ guests: clamp(b.guests - 1) })}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          id={id}
          type="number"
          min={1}
          max={6}
          value={b.guests}
          onChange={(e) => set({ guests: clamp(Number(e.target.value) || 1) })}
          className={cx(inputClass, "w-20 text-center tabular-nums")}
          data-testid="guests"
        />
        <button
          type="button"
          aria-label="Add a guest"
          className={stepBtn}
          disabled={b.guests >= 6}
          onClick={() => set({ guests: clamp(b.guests + 1) })}
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <span className={cx("ml-2 text-sm", muted)}>Adults and children</span>
      </div>
    </div>
  );
}

function RoomField({ b, set }: FieldProps) {
  return (
    <fieldset className="min-w-0 flex flex-col gap-3">
      <legend className="mb-3 text-sm font-medium text-slate-900">
        Room type at {hotelOf(b.destination).hotel}
      </legend>
      {rooms.map((r) => (
        <Choice
          key={r.id}
          name="room"
          checked={b.room === r.id}
          onChange={() => set({ room: r.id })}
          testId={`room-${r.id}`}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#EEF2FB] text-[#1E3A8A]">
            <BedDouble className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">{r.name}</span>
            <span className={cx("block text-sm", muted)}>{r.detail}</span>
            <span className={cx("mt-1 block text-xs tabular-nums", muted)}>
              {r.size} m², sleeps {r.sleeps}
            </span>
          </span>
          <span className="text-right">
            <span className="block font-semibold text-slate-900 tabular-nums">
              {money(roomRate(b.destination, r.id))}
            </span>
            <span className={cx("text-xs", muted)}>per night</span>
          </span>
        </Choice>
      ))}
    </fieldset>
  );
}

function DestinationStep({ b, set }: FieldProps) {
  const [sort, setSort] = useState("recommended");
  const { nights } = priceOf(b);
  const list = [...destinations].sort((x, y) =>
    sort === "price"
      ? x.rate - y.rate
      : sort === "rating"
        ? y.rating - x.rating
        : 0,
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cx("text-sm", muted)}>
          {destinations.length} stays available
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className={muted}>Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={cx(inputClass, "h-9 pr-8 text-sm")}
          >
            <option value="recommended">Recommended</option>
            <option value="price">Lowest price</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>
      <fieldset className="min-w-0 flex flex-col gap-3">
        <legend className="sr-only">Where to?</legend>
        {list.map((d) => (
          <Choice
            key={d.id}
            name="destination"
            checked={b.destination === d.id}
            onChange={() => set({ destination: d.id })}
            testId={`destination-${d.id}`}
            className="flex-col sm:flex-row"
          >
            <HotelArt
              scene={d.scene}
              className="h-36 w-full shrink-0 rounded-lg sm:h-32 sm:w-44"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className="max-w-full truncate font-semibold text-slate-900"
                  title={d.hotel}
                >
                  {d.hotel}
                </span>
                <Stars count={d.stars} />
              </span>
              <span className={cx("flex items-center gap-1 text-sm", muted)}>
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate" title={`${d.name}, ${d.area}`}>
                  {d.name}, {d.area}
                </span>
              </span>
              <RatingPill hotel={d} />
              <span className="flex flex-wrap gap-1.5 pt-1">
                {d.perks.map((perk) => (
                  <span
                    key={perk}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {perk}
                  </span>
                ))}
              </span>
              <span className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-1 pt-1">
                {d.freeCancellation ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check className="size-3.5" aria-hidden /> Free cancellation
                  </span>
                ) : (
                  <span className={cx("text-xs", muted)}>Non-refundable</span>
                )}
                <span className="ml-auto text-right">
                  <span className="block text-lg font-semibold text-slate-900 tabular-nums">
                    {money(d.rate)}
                    <span className={cx("ml-1 text-xs font-normal", muted)}>
                      per night
                    </span>
                  </span>
                  {nights > 0 && (
                    <span className={cx("block text-xs tabular-nums", muted)}>
                      {money(d.rate * nights)} for {nightsLabel(nights)}, before
                      taxes
                    </span>
                  )}
                </span>
              </span>
            </span>
          </Choice>
        ))}
      </fieldset>
    </div>
  );
}

function StepBody({ step, b, set }: { step: StepId } & FieldProps) {
  const [touched, setTouched] = useState(false);
  switch (step) {
    case "purpose":
      return (
        <fieldset className="min-w-0 grid gap-3 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-medium text-slate-900">
            What brings you there?
          </legend>
          <Choice
            name="purpose"
            checked={b.purpose === "leisure"}
            onChange={() => set({ purpose: "leisure" })}
            testId="purpose-leisure"
          >
            <Sun className="size-6 shrink-0 text-[#D97706]" aria-hidden />
            <span>
              <span className="block font-semibold text-slate-900">
                Leisure
              </span>
              <span className={cx("text-sm", muted)}>
                Holidays, weekends away and family visits
              </span>
            </span>
          </Choice>
          <Choice
            name="purpose"
            checked={b.purpose === "business"}
            onChange={() => set({ purpose: "business" })}
            testId="purpose-business"
          >
            <Briefcase className="size-6 shrink-0 text-[#1E3A8A]" aria-hidden />
            <span>
              <span className="block font-semibold text-slate-900">
                Business
              </span>
              <span className={cx("text-sm", muted)}>
                Invoices with your company details
              </span>
            </span>
          </Choice>
        </fieldset>
      );
    case "company": {
      const missing = touched && b.company.trim() === "";
      return (
        <div className="flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-900">
            Company name
            <input
              value={b.company}
              onChange={(e) => set({ company: e.target.value })}
              onBlur={() => setTouched(true)}
              placeholder="Northwind Traders"
              aria-invalid={missing}
              aria-describedby="company-hint"
              className={cx(inputClass, missing && "border-rose-500")}
              data-testid="company-name"
            />
            <span
              id="company-hint"
              className={cx(
                "text-xs font-normal",
                missing ? "text-rose-600" : muted,
              )}
            >
              {missing
                ? "Enter your company name to continue"
                : "Shown on your invoice"}
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-900">
            VAT or tax ID (optional)
            <input
              value={b.vat}
              onChange={(e) => set({ vat: e.target.value })}
              placeholder="PT 509 123 456"
              className={inputClass}
              data-testid="company-vat"
            />
          </label>
        </div>
      );
    }
    case "destination":
      return <DestinationStep b={b} set={set} />;
    case "dates": {
      const { nights } = priceOf(b);
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-900">
              Check-in
              <input
                type="date"
                value={b.checkIn}
                onChange={(e) => set({ checkIn: e.target.value })}
                className={inputClass}
                data-testid="check-in"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-900">
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
          </div>
          {nights > 0 ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="size-4 text-[#1E3A8A]" aria-hidden />
              {nightsLabel(nights)}, {fmtShort(b.checkIn)} to{" "}
              {fmtShort(b.checkOut)}
            </p>
          ) : (
            <p className="text-sm text-rose-600" role="alert">
              Check-out must be after check-in
            </p>
          )}
        </div>
      );
    }
    case "guests":
      return <GuestsField b={b} set={set} />;
    case "room":
      return <RoomField b={b} set={set} />;
    case "guestsRoom":
      return (
        <div className="flex flex-col gap-8">
          <GuestsField b={b} set={set} />
          <RoomField b={b} set={set} />
        </div>
      );
    case "extras": {
      const { nights } = priceOf(b);
      return (
        <fieldset className="min-w-0 flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-slate-900">
            Make your stay better
          </legend>
          {extras.map((e) => {
            const on = b.extras.includes(e.id);
            return (
              <label
                key={e.id}
                className={cx(
                  "flex cursor-pointer items-start gap-4 rounded-xl border p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1E3A8A]/40",
                  on
                    ? "border-[#1E3A8A] bg-[#EEF2FB]"
                    : cx(line, "bg-white hover:border-slate-300"),
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    set({
                      extras: on
                        ? b.extras.filter((x) => x !== e.id)
                        : [...b.extras, e.id],
                    })
                  }
                  className="mt-1 size-4 accent-[#1E3A8A] focus:outline-none"
                  data-testid={`extra-${e.id}`}
                />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">
                    {e.name}
                  </span>
                  <span className={cx("text-sm", muted)}>{e.detail}</span>
                </span>
                <span className="text-right text-sm">
                  <span className="block font-semibold text-slate-900 tabular-nums">
                    {money(e.price)}
                  </span>
                  <span className={cx("text-xs", muted)}>
                    {e.perNight
                      ? `per night, ${money(e.price * nights)} total`
                      : "one time"}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      );
    }
    case "review": {
      const hotel = hotelOf(b.destination);
      const room = rooms.find((r) => r.id === b.room);
      const price = priceOf(b);
      const rows: [string, string][] = [
        ...(b.purpose === "business"
          ? ([["Company", b.company]] as [string, string][])
          : []),
        ["Hotel", `${hotel.hotel}, ${hotel.name}`],
        [
          "Dates",
          `${formatDate(b.checkIn)} to ${formatDate(b.checkOut)} (${nightsLabel(price.nights)})`,
        ],
        ["Guests", String(b.guests)],
        ["Room", room?.name ?? ""],
        ...(b.extras.length
          ? ([["Extras", price.chosen.map((e) => e.name).join(", ")]] as [
              string,
              string,
            ][])
          : []),
      ];
      return (
        <div className="flex flex-col gap-5">
          <dl
            className={cx("divide-y divide-[#E3E7F0] rounded-xl border text-sm", line)}
            data-testid="summary"
          >
            {rows.map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3">
                <dt className={muted}>{k}</dt>
                <dd className="text-right font-medium text-slate-900">{val}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className={muted}>Taxes and fees</dt>
              <dd className="font-medium text-slate-900 tabular-nums">
                {money(price.taxes)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 rounded-b-xl bg-[#FFF7E6] px-4 py-3 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd
                className="font-semibold text-slate-900 tabular-nums"
                data-testid="total"
              >
                {money(price.total)}
              </dd>
            </div>
          </dl>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex gap-2 text-slate-700">
              <ShieldCheck
                className="size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              {hotel.freeCancellation
                ? "Free cancellation until 48 hours before check-in."
                : "Non-refundable rate. Date changes allowed up to 7 days before check-in."}
            </p>
            <p className="flex min-w-0 gap-2 text-slate-700">
              <Users className="size-5 shrink-0 text-[#1E3A8A]" aria-hidden />
              <span className="min-w-0 break-words">
                Booking for Alex Morgan, alex.morgan@example.com
              </span>
            </p>
          </div>
        </div>
      );
    }
  }
}

function Stepper({ steps, step }: { steps: StepId[]; step: StepId }) {
  const at = steps.indexOf(step);
  return (
    <nav aria-label="Booking steps" data-testid="step-indicator">
      <p className={cx("text-sm font-medium", navyText)}>
        Step {at + 1} of {steps.length}
      </p>
      <ol className="mt-3 flex gap-2">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={s === step ? "step" : undefined}
            title={stepMeta[s].title}
            className="flex min-w-0 flex-1 flex-col gap-2"
          >
            <span
              className={cx(
                "h-1.5 rounded-full",
                i <= at ? "bg-[#1E3A8A]" : "bg-[#DCE2EE]",
              )}
            />
            <span
              className={cx(
                "truncate text-xs max-sm:sr-only",
                i === at
                  ? "font-semibold text-slate-900"
                  : i < at
                    ? "text-slate-600"
                    : "text-slate-400",
              )}
            >
              {stepMeta[s].title}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SummaryAside({ v, b }: { v: boolean; b: Booking }) {
  const hotel = hotelOf(b.destination);
  const room = rooms.find((r) => r.id === b.room);
  const price = priceOf(b);
  return (
    <aside
      aria-label="Your stay"
      className={cx(
        "hidden self-start overflow-hidden lg:sticky lg:top-6 lg:block",
        panel,
      )}
    >
      <HotelArt scene={hotel.scene} className="h-36 w-full" />
      <div className="flex flex-col gap-4 p-5">
        <div>
          <p
            className="truncate font-semibold text-slate-900"
            title={hotel.hotel}
          >
            {hotel.hotel}
          </p>
          <p className={cx("text-sm", muted)}>{hotel.name}</p>
          <div className="mt-2">
            <RatingPill hotel={hotel} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={muted}>Check-in</dt>
            <dd className="font-medium text-slate-900">
              {fmtShort(b.checkIn)}
            </dd>
          </div>
          <div>
            <dt className={muted}>Check-out</dt>
            <dd className="font-medium text-slate-900">
              {fmtShort(b.checkOut)}
            </dd>
          </div>
          <div>
            <dt className={muted}>Guests</dt>
            <dd className="font-medium text-slate-900">
              {guestsLabel(b.guests)}
            </dd>
          </div>
          <div>
            <dt className={muted}>Room</dt>
            <dd className="font-medium text-slate-900">{room?.name}</dd>
          </div>
          {v && b.purpose === "business" && b.company && (
            <div className="col-span-2">
              <dt className={muted}>Company</dt>
              <dd
                className="truncate font-medium text-slate-900"
                title={b.company}
              >
                {b.company}
              </dd>
            </div>
          )}
        </dl>
        <dl className={cx("flex flex-col gap-2 border-t pt-4 text-sm", line)}>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">
              {money(price.rate)} × {nightsLabel(price.nights)}
            </dt>
            <dd className="tabular-nums">{money(price.roomTotal)}</dd>
          </div>
          {price.chosen.map((e) => (
            <div key={e.id} className="flex justify-between gap-3">
              <dt className="text-slate-600">{e.name}</dt>
              <dd className="tabular-nums">
                {money(e.perNight ? e.price * price.nights : e.price)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">
              Taxes and fees ({Math.round(TAX_RATE * 100)}%)
            </dt>
            <dd className="tabular-nums">{money(price.taxes)}</dd>
          </div>
          <div className="mt-1 flex justify-between gap-3 text-base font-semibold text-slate-900">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(price.total)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

function Confirmation({
  b,
  code,
  onRestart,
}: {
  b: Booking;
  code: string;
  onRestart: () => void;
}) {
  const hotel = hotelOf(b.destination);
  const room = rooms.find((r) => r.id === b.room);
  const price = priceOf(b);
  const itinerary = [
    {
      when: `${formatDate(b.checkIn)}, from 3:00 PM`,
      what: `Check in at ${hotel.hotel}`,
      Icon: MapPin,
    },
    {
      when: nightsLabel(price.nights),
      what: `${room?.name} room for ${guestsLabel(b.guests)}`,
      Icon: BedDouble,
    },
    ...price.chosen.map((e) => ({
      when: e.perNight ? "Every morning" : "Arranged for you",
      what: e.name,
      Icon: Sparkles,
    })),
    {
      when: `${formatDate(b.checkOut)}, by 11:00 AM`,
      what: "Check out",
      Icon: Clock,
    },
  ];
  return (
    <section
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 animate-fade-up"
      data-testid="booked"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-emerald-50">
          <CircleCheck className="size-8 text-emerald-600" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Your stay is booked
        </h1>
        <p className={muted}>
          Confirmation{" "}
          <span className="font-mono font-semibold text-slate-900">{code}</span>
          . We sent the details to alex.morgan@example.com.
        </p>
      </div>
      <div className={cx("overflow-hidden", panel)}>
        <div className="flex flex-col sm:flex-row">
          <HotelArt
            scene={hotel.scene}
            className="h-44 w-full sm:h-auto sm:w-64"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-6">
            <p className="text-lg font-semibold text-slate-900">
              {hotel.hotel}
            </p>
            <p className={cx("flex items-start gap-1 text-sm", muted)}>
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {hotel.name}, {hotel.area}
            </p>
            <RatingPill hotel={hotel} />
          </div>
        </div>
        <div
          className={cx(
            "grid gap-8 border-t p-6 md:grid-cols-[1fr_260px]",
            line,
          )}
        >
          <div>
            <h2 className="font-semibold text-slate-900">Itinerary</h2>
            <ol className="mt-4 flex flex-col">
              {itinerary.map((item, i) => (
                <li
                  key={`${item.what}-${i}`}
                  className="relative flex gap-4 pb-5 last:pb-0"
                >
                  {i < itinerary.length - 1 && (
                    <span className="absolute top-9 bottom-0 left-[17px] w-px bg-[#DCE2EE]" />
                  )}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF2FB] text-[#1E3A8A]">
                    <item.Icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-900">
                      {item.what}
                    </span>
                    <span className={cx("text-sm", muted)}>{item.when}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Payment</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Room</dt>
                <dd className="tabular-nums">{money(price.roomTotal)}</dd>
              </div>
              {price.extrasTotal > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Extras</dt>
                  <dd className="tabular-nums">{money(price.extrasTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Taxes and fees</dt>
                <dd className="tabular-nums">{money(price.taxes)}</dd>
              </div>
              <div
                className={cx(
                  "flex justify-between gap-3 border-t pt-2 font-semibold text-slate-900",
                  line,
                )}
              >
                <dt>Paid today</dt>
                <dd className="tabular-nums">{money(price.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className={secondary}
          onClick={() => window.print()}
        >
          <Printer className="size-4" aria-hidden /> Print itinerary
        </button>
        <button
          type="button"
          className={primary}
          onClick={onRestart}
          data-testid="new-booking"
        >
          Plan another stay
        </button>
      </div>
    </section>
  );
}

const navLinks = ["Stays", "Deals", "Your trips", "Gift cards"];

function SiteHeader({ toast }: { toast: (m: string) => void }) {
  const link =
    "rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const iconBtn =
    "grid size-9 place-items-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";
  return (
    <header className={navy}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <div className="text-white md:hidden">
          <MobileNav label="Menu">
            <nav
              aria-label="Main"
              className="mt-4 flex flex-col gap-1"
              style={font}
            >
              {navLinks.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => toast(`${l} opened`)}
                >
                  {l}
                </button>
              ))}
            </nav>
          </MobileNav>
        </div>
        <span
          className="flex items-center gap-2 text-lg font-semibold text-white"
          data-testid="logo"
        >
          <Logo className="size-8 rounded-[9px] ring-1 ring-white/25" />
          Tripway
        </span>
        <nav
          aria-label="Main"
          className="ml-6 hidden items-center gap-1 md:flex"
        >
          {navLinks.map((l, i) => (
            <button
              key={l}
              type="button"
              aria-current={i === 0 ? "page" : undefined}
              className={cx(link, i === 0 && "bg-white/10 text-white")}
              onClick={() => toast(`${l} opened`)}
            >
              {l}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 text-white">
          <button
            type="button"
            className={cx(link, "hidden sm:inline-flex")}
            onClick={() => toast("Currency set to USD")}
          >
            USD
          </button>
          <button
            type="button"
            aria-label="Help"
            className={iconBtn}
            onClick={() => toast("Help center opened")}
          >
            <CircleHelp className="size-5" aria-hidden />
          </button>
          <NotificationsMenu
            items={notifications}
            triggerClassName="hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          />
          <span className="ml-1 flex">
            <UserMenu
              name="Alex Morgan"
              email="alex.morgan@example.com"
              items={["Your trips", "Saved stays", "Account settings"]}
              onSelect={(item) =>
                toast(item === "Sign out" ? "Signed out" : `${item} opened`)
              }
            />
          </span>
        </div>
      </div>
    </header>
  );
}

function Hero({ b, first }: { b: Booking; first: boolean }) {
  const hotel = hotelOf(b.destination);
  const cells = [
    { label: "Where", value: hotel.name, Icon: MapPin },
    {
      label: "When",
      value: `${fmtShort(b.checkIn)} to ${fmtShort(b.checkOut)}`,
      Icon: CalendarDays,
    },
    { label: "Who", value: guestsLabel(b.guests), Icon: Users },
  ];
  return (
    <section className={cx(navy, "text-white")}>
      <div
        className={cx(
          "mx-auto max-w-6xl px-4 sm:px-6",
          first ? "pt-8 pb-16 md:pt-12" : "pt-2 pb-14",
        )}
      >
        {first ? (
          <>
            <p className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Stays you'll want to come back to
            </p>
            <p className="mt-3 max-w-xl text-white/75">
              Over 2 million homes and hotels, verified reviews, and no booking
              fees.
            </p>
          </>
        ) : (
          <p className="text-sm text-white/75">Complete your booking</p>
        )}
        <dl
          aria-label="Your search"
          className={cx(
            "mt-6 overflow-hidden rounded-xl bg-white text-slate-900 shadow-lg shadow-black/10 sm:grid-cols-3",
            first ? "grid" : "hidden md:grid",
          )}
        >
          {cells.map((c, i) => (
            <div
              key={c.label}
              className={cx(
                "flex items-center gap-3 px-4 py-3",
                i > 0 && "border-t border-[#E3E7F0] sm:border-t-0 sm:border-l",
              )}
            >
              <c.Icon className="size-5 shrink-0 text-[#1E3A8A]" aria-hidden />
              <div className="min-w-0">
                <dt className={cx("text-xs", muted)}>{c.label}</dt>
                <dd className="truncate text-sm font-medium" title={c.value}>
                  {c.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const footerCols: [string, string[]][] = [
  ["Support", ["Help center", "Cancellation options", "Safety information"]],
  ["Discover", ["Seasonal deals", "Travel guides", "Tripway points"]],
  ["Company", ["About Tripway", "Careers", "Press"]],
];

function SiteFooter({ toast }: { toast: (m: string) => void }) {
  return (
    <footer className={cx("border-t bg-white", line)}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div>
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <Logo className="size-7" /> Tripway
          </span>
          <p className={cx("mt-3 max-w-xs text-sm", muted)}>
            Book hotels and homes in 190 countries with free cancellation on
            most stays.
          </p>
        </div>
        {footerCols.map(([title, items]) => (
          <div key={title}>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className={cx(
                      "rounded-sm text-slate-600 hover:text-slate-900 hover:underline",
                      focusRing,
                    )}
                    onClick={() => toast(`${item} opened`)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={cx("border-t", line)}>
        <p className={cx("mx-auto max-w-6xl px-4 py-4 text-xs sm:px-6", muted)}>
          © 2026 Tripway Travel Ltd. Prices include all fees shown before you
          book.
        </p>
      </div>
    </footer>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [booking, setBooking] = useState(() => initialBooking(v));
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  const [toasts, toast] = useToasts("bg-slate-900 text-white");

  const set = (patch: Partial<Booking>) =>
    setBooking((cur) => ({ ...cur, ...patch }));
  const steps = stepsFor(v, booking.purpose);
  const step = steps[Math.min(index, steps.length - 1)];
  const price = priceOf(booking);
  const hotel = hotelOf(booking.destination);
  const canNext =
    (step !== "company" || booking.company.trim() !== "") &&
    (step !== "dates" || price.nights > 0);

  const { title, lead, Icon } = stepMeta[step];
  useDocumentTitle(code ? "Booking confirmed – Tripway" : `${title} – Tripway`);

  const book = () => {
    setConfirming(false);
    setCode("TW-48213");
    toast("Booking confirmed");
  };
  const restart = () => {
    setBooking(initialBooking(v));
    setIndex(0);
    setCode("");
  };

  return (
    <div
      className={cx("flex min-h-screen flex-col text-slate-900", page)}
      style={font}
    >
      <SiteHeader toast={toast} />
      {code ? (
        <main className="flex-1 px-4 py-10 sm:px-6">
          <Confirmation b={booking} code={code} onRestart={restart} />
        </main>
      ) : (
        <>
          <Hero b={booking} first={index === 0} />
          <main className="mx-auto -mt-8 grid w-full max-w-6xl flex-1 gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-5">
              <div
                className={cx(
                  "flex flex-col gap-6 p-5 shadow-sm sm:p-7",
                  panel,
                )}
              >
                <Stepper steps={steps} step={step} />
                <div className={cx("border-t pt-6", line)}>
                  <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
                    <Icon className="size-6 text-[#1E3A8A]" aria-hidden />
                    {title}
                  </h1>
                  <p className={cx("mt-1 text-sm", muted)}>{lead}</p>
                </div>
                <StepBody key={step} step={step} b={booking} set={set} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className={secondary}
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  data-testid="prev-step"
                >
                  <ArrowLeft className="size-4" aria-hidden /> Back
                </button>
                <span className="ml-auto text-right text-sm lg:hidden">
                  <span className={cx("block text-xs", muted)}>Total</span>
                  <span className="font-semibold tabular-nums">
                    {money(price.total)}
                  </span>
                </span>
                {step === "review" ? (
                  <button
                    type="button"
                    className={primary}
                    onClick={() => (v ? book() : setConfirming(true))}
                    data-testid="book-now"
                  >
                    Book now
                  </button>
                ) : (
                  <button
                    type="button"
                    className={primary}
                    disabled={!canNext}
                    onClick={() => setIndex((i) => i + 1)}
                    data-testid="next-step"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
            <SummaryAside v={v} b={booking} />
          </main>
        </>
      )}
      <SiteFooter toast={toast} />
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirm your booking"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-xl"
        testId="confirm-dialog"
      >
        <p className="mt-2 text-sm text-slate-600">
          You'll be charged {money(price.total)} for {nightsLabel(price.nights)}{" "}
          at {hotel.hotel}.{" "}
          {hotel.freeCancellation
            ? "Free cancellation until 48 hours before check-in."
            : "This rate is non-refundable."}
        </p>
        <div className="mt-6 flex justify-end gap-2">
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
