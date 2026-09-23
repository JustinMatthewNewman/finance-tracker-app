"use client";

import LedgerPage from "@/components/Records/LedgerPage";

// The money-in half of the ledger. Everything lives in LedgerPage — see the
// note there on why this is not a second copy of the same file.
function IncomePage() {
  return (
    <LedgerPage
      direction="INCOME"
      title="Income"
      emptyMessage="No income recorded for this month."
      postedLabel="Received"
      markLabel="Mark received"
      addLabel="Add income"
      accentClass="text-success"
    />
  );
}

export default IncomePage;
