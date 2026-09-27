# Example statements

Fake Wells Fargo exports. Real ones go in `transaction_data/`, which is
gitignored; these are committed, and `lib/wellsFargoCsv.test.ts` and
`lib/importReconcile.test.ts` read them, so they are what keeps the importer
honest in CI. Every name, card number, phone number and reference here is
invented.

| file | what it is for |
|---|---|
| `Checking.csv` | One of every memo shape a real export contains — card authorizations, recurring payments, Zelle in and out, internal transfers, an ATM withdrawal and its fee, a mobile deposit, a purchase return, ACH payroll, a check, and two byte-identical coffees on the same day. The general parsing fixture. |
| `Savings.csv` | A second account, so the same amount on the same day in two accounts stays two transactions. Interest payments and the other leg of each internal transfer. |
| `Checking-2026-09-15.csv` | A statement downloaded on 15 September. **Three of its rows are still `Pending`.** |
| `Checking-2026-10-05.csv` | The same account, downloaded three weeks later, covering a wider range that overlaps the file above. |

## What the overlapping pair is for

It is the re-upload case, which is how people actually use an importer: download
a month, then download a wider range later to fill a gap. The second file
deliberately contains one of every outcome the reconciler has to get right.

**Rows that repeat unchanged** — payroll, the check, Amazon, the transfer, self
storage, the Wegmans shop on 08/28, both 08/31 coffees. Identical lines, so
`Transaction.importKey` matches and they are skipped as certain.

**The two identical coffees on 08/31.** Same day, same amount, same memo, and
both are real. They must survive as two rows, and a re-upload must match *two*
of them and import neither — this is the case that a naive "have I seen this
amount on this day" check destroys.

**A third coffee on 10/02.** Same amount, same merchant, a month later. It has a
reference of its own, so it is new and must import — the two on 08/31 must not
absorb it.

**Three pending rows that have since settled.** This is the case a fingerprint
cannot catch, because Wells Fargo reports the same purchase twice in two
different formats:

| | 15 Sep file | 5 Oct file |
|---|---|---|
| memo | `PURCHASE LE BERNARDIN +15550001234 NY CARD0000` | `PURCHASE AUTHORIZED ON 09/15 LE BERNARDIN RESTAURANT NEW YORK NY S000000000000014 CARD 0000` |
| date | 09/15 | 09/16 |
| amount | 1284.50 | 1412.95 — a tip was added |
| reference | none | `S000000000000014` |

Nothing matches. The pending row carries no reference, so the reconciler has
only amount, date and merchant to go on — and for Le Bernardin the amount
changed too. These are reported for a person to confirm, never skipped
automatically. The HOA charge settled a day later for the same amount; the
internal transfer settled two days later and gained a reference.

**A second Wegmans shop on 09/18 for exactly 968.31**, the same amount as the
08/28 one. Both are settled and carry *different* references, which is proof
they are two separate shops — so it must import, with no duplicate warning. This
is the false positive that amount-and-merchant matching alone produces.

**The streaming subscription.** 84.99 on 09/01 and again on 10/01, same
merchant. Same amount and same merchant, but a month apart and with different
references — a subscription, not a duplicate.
