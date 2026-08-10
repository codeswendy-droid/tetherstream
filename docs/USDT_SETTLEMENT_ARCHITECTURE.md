# USDT TRC-20 STATIC-ADDRESS SETTLEMENT ARCHITECTURE

**System**: Titan Stream Financial Engine  
**Network**: TRON TRC-20  
**Canonical USDT Token Contract**: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (Mainnet) / `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` (Nile Testnet)  

---

## 1. Overview

The USDT funding rail allows users to fund their accounts using direct USDT token transfers to an administrator-configured static receiving address on the TRON blockchain (TRC-20).

Crucially, **no balance credits occur directly from raw blockchain events**. Instead, incoming transfers pass through a deterministic, ambiguity-safe session matching engine and enter the financial ledger exclusively via `FinancialOrchestratorService.requestOperation(SYSTEM_ALLOCATION)`.

---

## 2. End-to-End Financial Orchestration Flow

```text
  TRON BLOCKCHAIN            USDT SCANNER WORKER           MATCHING ENGINE             FINANCIAL CORE
┌──────────────────┐       ┌──────────────────────┐    ┌─────────────────────┐     ┌─────────────────────┐
│  Incoming TRC-20 │ ────► │ UsdtBlockchain-      │ ─► │ UsdtDepositMatching │ ──► │ UsdtProvider        │
│  Transfer        │       │ MonitorService       │    │ Service             │     │ approveSettlement() │
└──────────────────┘       └──────────────────────┘    └─────────────────────┘     └──────────┬──────────┘
                                                                                              │
                                                                                              ▼
                                                                                   FinancialOrchestrator
                                                                                              │
                                                                                              ▼
                                                                                   SYSTEM_ALLOCATION
                                                                                              │
                                                                                              ▼
                                                                                   LedgerService
                                                                                   (Double-Entry)
                                                                                              │
                                                                                              ▼
                                                                                   BalanceEngine
                                                                                   (User Balance)
```

---

## 3. Core Principles & Safety Invariants

1. **Static Address Model**: Titan Stream uses ONE active administrator-configured receiving address. Read-only monitoring is enforced (zero private keys stored or requested).
2. **Deterministic Session Matching**:
   - Matching verifies: `recipientAddress === activeAddress`, `tokenContract === canonicalContract`, `network === TRON`, `confirmations >= 19`, and exact session amount matching within session time window.
   - **Ambiguity Protection**: If multiple active sessions match the exact amount, the transaction is marked `AMBIGUOUS_MATCH` and requires manual admin resolution. Zero balance credit occurs automatically.
   - **Underpayment & Overpayment Safety**: Underpayments and overpayments are flagged as `UNDERPAYMENT` or `OVERPAYMENT` and do not produce unauthorized automatic credits.
3. **Idempotency & Restart Safety**:
   - The database enforces a unique index on `(network, tokenContract, transactionHash)`.
   - Every transaction is financially consumable exactly ONCE. Re-scanning or restarting scanner workers results in an idempotent no-op.
4. **Single Financial Core Authority**:
   - All balance updates flow through `FinancialOrchestratorService` -> `LedgerService` -> `BalanceEngine`.
