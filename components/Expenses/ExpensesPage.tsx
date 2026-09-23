"use client";

import LedgerPage from "@/components/Records/LedgerPage";

// The money-out half of the ledger. See LedgerPage.
function ExpensesPage() {
  return (
    <LedgerPage
      direction="EXPENSE"
      title="Expenses"
      emptyMessage="No expenses recorded for this month."
      postedLabel="Paid"
      markLabel="Mark paid"
      addLabel="Add expense"
      accentClass="text-danger"
    />
  );
}

export default ExpensesPage;
