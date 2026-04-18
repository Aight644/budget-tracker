// Column-mapping presets for common Australian bank CSV exports.
// Values are 0-based column indices. -1 means "not present".
// hasHeader: whether the first row is column names (skip it when parsing).

export const BANK_PRESETS = [
  {
    id: "cba",
    name: "CBA (Commonwealth Bank)",
    desc: "Date, Amount, Description, Balance",
    map: { dateIdx: 0, amountIdx: 1, descIdx: 2, debitIdx: -1, creditIdx: -1, hasHeader: false },
  },
  {
    id: "anz",
    name: "ANZ",
    desc: "Date, Amount, Description",
    map: { dateIdx: 0, amountIdx: 1, descIdx: 2, debitIdx: -1, creditIdx: -1, hasHeader: false },
  },
  {
    id: "westpac",
    name: "Westpac",
    desc: "Account, Date, Narrative, Debit, Credit, Balance",
    map: { dateIdx: 1, descIdx: 2, amountIdx: -1, debitIdx: 3, creditIdx: 4, hasHeader: true },
  },
  {
    id: "nab",
    name: "NAB",
    desc: "Date, Amount, Type, Description, Balance",
    map: { dateIdx: 0, amountIdx: 1, descIdx: 3, debitIdx: -1, creditIdx: -1, hasHeader: false },
  },
  {
    id: "up",
    name: "Up Bank",
    desc: "Date, Description, Amount",
    map: { dateIdx: 0, descIdx: 1, amountIdx: 2, debitIdx: -1, creditIdx: -1, hasHeader: true },
  },
  {
    id: "ing",
    name: "ING",
    desc: "Date, Description, Debit, Credit, Balance",
    map: { dateIdx: 0, descIdx: 1, amountIdx: -1, debitIdx: 2, creditIdx: 3, hasHeader: true },
  },
  {
    id: "macquarie",
    name: "Macquarie",
    desc: "Date, Amount, Description, Balance",
    map: { dateIdx: 0, amountIdx: 1, descIdx: 2, debitIdx: -1, creditIdx: -1, hasHeader: true },
  },
  {
    id: "bendigo",
    name: "Bendigo Bank",
    desc: "Date, Debit, Credit, Description",
    map: { dateIdx: 0, descIdx: 3, amountIdx: -1, debitIdx: 1, creditIdx: 2, hasHeader: true },
  },
];
