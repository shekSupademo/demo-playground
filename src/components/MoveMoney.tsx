import { ArrowLeft, Check, FileCheck2, Plus } from "lucide-react";
import { useState } from "react";
import { isoDay } from "../data/seed";
import type { Recipient } from "../data/types";
import { longDate, money, parseDollars, uid } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { Dropdown } from "./Dropdown";
import { Avatar, Button, Field, Input, Modal, Select } from "./ui";

type Step = "recipient" | "verify" | "details" | "delivery" | "review" | "done";

const verificationFileLimit = 5 * 1024 * 1024;
const verificationFileTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export function SendMoneyModal({ open, onClose, initialRecipientId, guided = false }: { open: boolean; onClose: () => void; initialRecipientId?: string; guided?: boolean }) {
  const { recipients, accounts } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const checking = accounts.filter((a) => a.type === "checking");

  const firstStep = guided ? (initialRecipientId ? "verify" : "recipient") : "details";
  const [step, setStep] = useState<Step>(firstStep);
  const [recipientId, setRecipientId] = useState(initialRecipientId ?? "");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Recipient, "id">>({ name: "", email: "", bank: "", last4: "", method: "ach" });
  const [amountText, setAmountText] = useState("");
  const [accountId, setAccountId] = useState(checking[0]?.id ?? "");
  const [date, setDate] = useState(isoDay(new Date()));
  const [memo, setMemo] = useState("");
  const [touched, setTouched] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [detailsMatch, setDetailsMatch] = useState(false);

  const canVerify = Boolean(documentType && documentName && detailsMatch);

  function selectRecipient(id: string) {
    if (id === recipientId) return;
    setRecipientId(id);
    setDocumentType("");
    setDocumentName("");
    setDocumentError("");
    setDetailsMatch(false);
  }

  function attachDocument(file?: File) {
    if (!file) return;
    setDetailsMatch(false);
    setDocumentName("");
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || (file.type && !verificationFileTypes.has(file.type))) {
      setDocumentError("Choose a PDF, PNG, or JPG file.");
    } else if (file.size === 0 || file.size > verificationFileLimit) {
      setDocumentError("Choose a non-empty file up to 5 MB.");
    } else {
      setDocumentError("");
      setDocumentName(file.name);
    }
  }

  const recipient = recipients.find((r) => r.id === recipientId);
  const account = accounts.find((a) => a.id === accountId);
  const amount = parseDollars(amountText);
  const today = isoDay(new Date());

  const recipientError = touched && !recipient ? "Choose who to pay" : undefined;
  const amountError = !touched ? undefined : amount === null || amount <= 0 ? "Enter an amount greater than $0" : account && amount > account.balance ? `Exceeds available balance of ${money(account.balance)}` : undefined;
  const dateError = !date ? "Choose a date" : date < today ? "Date can't be in the past" : undefined;
  const draftValid = draft.name.trim() && /\S+@\S+\.\S+/.test(draft.email) && draft.bank.trim() && /^\d{4}$/.test(draft.last4);

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(firstStep);
      setAmountText("");
      setMemo("");
      setTouched(false);
      setAdding(false);
    }, 0);
  };

  const submit = () => {
    if (!recipient || !amount || (guided && !canVerify)) return;
    dispatch({ type: "payment/send", recipientId: recipient.id, accountId, amount, date, memo });
    toast(`${money(amount)} to ${recipient.name} ${date === today ? "is on its way" : `scheduled for ${longDate(date)}`}`);
    setStep("done");
  };

  const selectingRecipient = step === "recipient" || (step === "details" && !guided);
  const recipientFields = (
    <>
      <div>
        <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Pay to</span>
        <Dropdown
          label="Recipient"
          placeholder="Choose a recipient"
          value={recipientId}
          onChange={selectRecipient}
          options={recipients.map((r) => ({ value: r.id, label: r.name, hint: `${r.method.toUpperCase()} ••${r.last4}` }))}
          testId="recipient-select"
        />
        {recipientError && <span className="mt-1 block text-xs text-rose-600">{recipientError}</span>}
      </div>
      <button type="button" onClick={() => setAdding(true)} className="-mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        <Plus className="size-3.5" /> Add new recipient
      </button>
    </>
  );
  const deliveryFields = (
    <>
      <Field label="Send on" error={dateError}>
        <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Memo (optional)">
        <Input value={memo} maxLength={80} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. October retainer" />
      </Field>
    </>
  );

  return (
    <Modal open={open} onClose={close} title={step === "review" ? "Review payment" : "Send money"} testId="send-money-modal">
      {selectingRecipient && adding && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draftValid) return;
            const r = { ...draft, id: uid("rec") };
            dispatch({ type: "recipient/add", recipient: r });
            selectRecipient(r.id);
            setAdding(false);
            if (guided) setStep("verify");
          }}
        >
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank">
              <Input value={draft.bank} onChange={(e) => setDraft({ ...draft, bank: e.target.value })} />
            </Field>
            <Field label="Account last 4" hint="4 digits">
              <Input inputMode="numeric" maxLength={4} value={draft.last4} onChange={(e) => setDraft({ ...draft, last4: e.target.value.replace(/\D/g, "") })} />
            </Field>
          </div>
          <Field label="Method">
            <Select value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value as "ach" | "wire" })}>
              <option value="ach">ACH (1–2 business days, free)</option>
              <option value="wire">Domestic wire (same day)</option>
            </Select>
          </Field>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button type="submit" variant="primary" disabled={!draftValid}>
              Save recipient
            </Button>
          </div>
        </form>
      )}

      {guided && step !== "done" && (
        <ol aria-label="Payment progress" className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          {([["recipient", "Recipient"], ["verify", "Verify"], ["details", "Amount"], ["delivery", "Delivery"], ["review", "Review"]] as const).map(([id, label], index) => (
            <li key={id} aria-current={step === id ? "step" : undefined} className={step === id ? "font-semibold text-indigo-600 dark:text-indigo-400" : undefined}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      )}

      {step === "recipient" && !adding && (
        <div className="space-y-3">
          {recipientFields}
          <div className="flex justify-end">
            <Button variant="primary" disabled={!recipient} onClick={() => setStep("verify")}>Verify recipient</Button>
          </div>
        </div>
      )}

      {step === "verify" && recipient && (
        <div className="space-y-4" data-testid="payment-verify">
          <h3 className="font-semibold">Verify recipient details</h3>
          <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-800">
            <p className="font-medium">{recipient.name}</p>
            <p>{recipient.bank} ••{recipient.last4} · {recipient.method.toUpperCase()}</p>
          </div>
          <Field label="Document type">
            <Select value={documentType} onChange={(e) => {
              setDocumentType(e.target.value);
              setDetailsMatch(false);
            }}>
              <option value="">Choose a document type</option>
              <option>Invoice</option>
              <option>Bank letter</option>
              <option>Vendor agreement</option>
            </Select>
          </Field>
          <div>
            <p id="verification-document-label" className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Supporting document</p>
            <input
              id="verification-document"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              aria-labelledby="verification-document-label"
              aria-describedby={documentError ? "verification-file-hint verification-file-error" : "verification-file-hint"}
              aria-invalid={!!documentError}
              data-testid="verification-document"
              className="peer sr-only"
              onChange={(e) => {
                attachDocument(e.currentTarget.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <label htmlFor="verification-document" className="inline-flex cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800">
              {documentName ? "Replace file" : "Choose file"}
            </label>
            <p id="verification-file-hint" className="mt-1 text-xs text-zinc-500">Use a sample PDF, PNG, or JPG up to 5 MB. The file stays in this browser.</p>
            {documentError && <p id="verification-file-error" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-300">{documentError}</p>}
            {documentName && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm dark:bg-indigo-950/50">
                <p role="status" className="flex min-w-0 items-center gap-2">
                  <FileCheck2 className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{documentName}</span>
                </p>
                <Button size="sm" variant="ghost" onClick={() => { setDocumentName(""); setDetailsMatch(false); }}>Remove file</Button>
              </div>
            )}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-indigo-600" checked={detailsMatch} onChange={(e) => setDetailsMatch(e.target.checked)} disabled={!documentType || !documentName} />
            <span>I checked that the document matches the recipient’s details.</span>
          </label>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("recipient")}><ArrowLeft className="size-4" /> Back</Button>
            <Button variant="primary" disabled={!canVerify} onClick={() => setStep("details")}>Confirm recipient</Button>
          </div>
        </div>
      )}

      {step === "details" && !adding && (
        <div className="space-y-4">
          {!guided && recipientFields}
          <Field label="Amount" error={amountError}>
            <Input inputMode="decimal" placeholder="$0.00" value={amountText} onChange={(e) => setAmountText(e.target.value)} onBlur={() => setTouched(true)} data-testid="amount-input" className="h-12 text-xl font-semibold tabular" />
          </Field>
          <Field label="From account" hint={account ? `Available ${money(account.balance)}` : undefined}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {checking.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ••{a.last4}
                </option>
              ))}
            </Select>
          </Field>
          {!guided && deliveryFields}
          <div className={guided ? "flex justify-between pt-2" : "flex justify-end pt-2"}>
            {guided && <Button variant="ghost" onClick={() => setStep("verify")}><ArrowLeft className="size-4" /> Back</Button>}
            <Button
              variant="primary"
              data-testid="continue-send"
              onClick={() => {
                setTouched(true);
                if (recipient && amount && amount > 0 && account && amount <= account.balance && (guided || !dateError)) setStep(guided ? "delivery" : "review");
              }}
            >
              {guided ? "Continue to delivery" : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {step === "delivery" && (
        <div className="space-y-4" data-testid="payment-delivery">
          <h3 className="font-semibold">Delivery details</h3>
          {deliveryFields}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("details")}><ArrowLeft className="size-4" /> Back</Button>
            <Button variant="primary" disabled={!!dateError} onClick={() => setStep("review")}>Review</Button>
          </div>
        </div>
      )}

      {step === "review" && recipient && amount && account && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-indigo-50 py-5 text-center dark:bg-indigo-950/40">
            <Avatar name={recipient.name} size="lg" />
            <p className="tabular text-3xl font-semibold tracking-tight">{money(amount)}</p>
            <p className="text-sm text-zinc-500">to {recipient.name}</p>
          </div>
          <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800" data-testid="payment-review">
            {[
              ["Amount", money(amount)],
              ["To", `${recipient.name} (${recipient.bank} ••${recipient.last4})`],
              ["From", `${account.name} ••${account.last4}`],
              ["Method", recipient.method === "wire" ? "Domestic wire" : "ACH"],
              ["Date", date === today ? "Today" : longDate(date)],
              ["Memo", memo || "—"],
              ...(guided ? [["Verification", `${documentType} · ${documentName}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-3 py-2.5">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(guided ? "delivery" : "details")}>
              <ArrowLeft className="size-4" /> Edit
            </Button>
            <Button variant="primary" onClick={submit} data-testid="confirm-send">
              Send {money(amount)}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
            <Check className="size-6" />
          </span>
          <p className="font-medium">Payment submitted</p>
          <p className="text-sm text-zinc-500">It shows as pending in Transactions until it settles.</p>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[2]?.id ?? "");
  const [amountText, setAmountText] = useState("");
  const from = accounts.find((a) => a.id === fromId);
  const amount = parseDollars(amountText);
  const error = !amountText ? undefined : amount === null || amount <= 0 ? "Enter a valid amount" : from && amount > from.balance ? "Not enough funds in this account" : fromId === toId ? "Pick two different accounts" : undefined;
  const valid = amount && amount > 0 && !error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer between accounts"
      testId="transfer-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              if (!amount) return;
              dispatch({ type: "transfer", fromId, toId, amount });
              toast(`Moved ${money(amount)} to ${accounts.find((a) => a.id === toId)?.name}`);
              setAmountText("");
              onClose();
            }}
          >
            Transfer
          </Button>
        </>
      }
    >
      <Field label="From">
        <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {money(a.balance)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="To">
        <Select value={toId} onChange={(e) => setToId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {money(a.balance)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Amount" error={error}>
        <Input inputMode="decimal" placeholder="$0.00" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
      </Field>
    </Modal>
  );
}
