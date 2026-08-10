# USDT ADMIN OPERATIONS & RECONCILIATION GUIDE

**System**: Titan Stream Admin Console  
**Module**: USDT Static Address Operations  

---

## 1. Viewing & Updating Active Receiving Address

Administrators manage the active receiving address via the Admin API or Operations Dashboard.

### Endpoints:
- `GET /api/v1/admin/settlement/usdt/config`: View active address, network, required confirmations, block lag, and scanner health status.
- `POST /api/v1/admin/settlement/usdt/config`: Update or rotate receiving address.

### Validation Rules:
- TRON address syntax is enforced before saving (`UsdtAddressValidator.validateOrThrow`).
- Rotating the address automatically deactivates the previous address in `UsdtAddressHistory` while keeping historical deposits reconcilable.

---

## 2. Monitoring Observed Blockchain Transactions

`GET /api/v1/admin/settlement/usdt/transactions`

Displays all observed TRC-20 transfers with processing status:
- `DETECTED`: Discovered on chain, awaiting confirmation threshold.
- `CONFIRMING`: Confirmations increasing towards target finality.
- `MATCHED`: Matched to a single active `SettlementSession`.
- `SETTLED`: Financial credit successfully posted via `FinancialOrchestratorService`.
- `AMBIGUOUS_MATCH`: Flagged because multiple user sessions match exact amount. Requires admin resolution.
- `UNDERPAYMENT` / `OVERPAYMENT`: Amount mismatch against active session.
- `DUPLICATE`: Transaction hash already processed.

---

## 3. Resolving Ambiguous Transactions

If a deposit is marked `AMBIGUOUS_MATCH`:
1. Inspect the transaction details and candidate settlement sessions.
2. Call `POST /api/v1/admin/settlement/usdt/transactions/:id/resolve`:
   ```json
   {
     "targetSettlementSessionId": "session_uuid",
     "reason": "Verified user deposit screenshot & transaction payload"
   }
   ```
3. The resolution idempotently invokes `UsdtProvider.approveSettlement()`, which triggers `SYSTEM_ALLOCATION` on `FinancialOrchestratorService`.
