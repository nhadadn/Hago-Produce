# CRA (Canada Revenue Agency) Compliance

## Overview
As a Canadian business, Hago Produce must comply with CRA regulations regarding electronic records.

## Requirements

1.  **Record Retention:**
    - Books and records must be kept for at least 6 years from the end of the last tax year they relate to.
    - Electronic records must be readable and accessible.

2.  **Data Integrity:**
    - Ensure invoices cannot be altered without an audit trail (Soft Deletes / Amendment Logs).

3.  **Server Location:**
    - While not strictly required to be in Canada, data must be accessible to CRA officials upon request.

## Implementation Plan
- **Audit Logging:** Track all modifications to Invoices.
- **Backups:** Regular automated backups.
- **Export:** Ability to export ledgers and invoices in readable formats (PDF, CSV).
