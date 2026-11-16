import { TransactionTable } from "../components/TransactionTable";
import { PageHeader } from "../components/ui";

export function Transactions() {
  return (
    <>
      <PageHeader title="Transactions" subtitle="Every transaction across your accounts, ready to search, sort and export." />
      <TransactionTable />
    </>
  );
}
