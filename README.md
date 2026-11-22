# Swift (Global Ledger)

A peer-to-peer digital wallet that combines three ideas:

| Idea from | What Swift builds |
|---|---|
| **UPI** | Instant transfers to a `@swift` handle (`alice@swift` -> `bob@swift`) |
| **FamPay** | Virtual debit card with an instant **Freeze** switch and a **Transaction limit** |
| **PayPal** | Multi-currency display, **double-payment protection** (Idempotency-Key + Redis), clean ledger |

**Stack:** Java 21 · Spring Boot 3.3 · PostgreSQL 16 · Redis 7 · Kafka 3.7 (KRaft) · Spring Security 6 (stateless JWT) · SpringDoc Swagger · React 18 · TypeScript · Tailwind CSS · Lucide icons · JUnit 5

---

## 1. Prerequisites
- Docker Desktop (or Docker Engine + Compose)
- JDK 21 and Maven 3.9+ (or open `backend/` in IntelliJ IDEA)
- Node.js 18+

## 2. Run it (3 terminals)

```bash
# Terminal 1 - infrastructure (from this folder)
docker compose up -d
docker compose ps                # swift_db and swift_redis should say "healthy"

# Terminal 2 - backend (from backend/)
mvn spring-boot:run              # http://localhost:8080

# Terminal 3 - frontend (from frontend/)
npm install
npm run dev                      # http://localhost:5173
```

Open **http://localhost:5173** and click **Login as Alice**. Open a private window and log in as Bob to watch money arrive (the app refreshes every 8 seconds and when you return to the tab).

> **Already ran an earlier version?** Run `docker compose down -v` once, then `docker compose up -d`, so the demo accounts are re-created together with their sample payment history.

Host ports used (chosen to avoid common local conflicts): PostgreSQL **15433**, Redis **16380**, Kafka **19094**. If one is still taken on your machine, change it in both `docker-compose.yml` and `backend/src/main/resources/application.yml`.

Useful URLs:
- Health check: http://localhost:8080/api/health
- Swagger UI: http://localhost:8080/swagger-ui.html (log in via `/api/auth/login`, copy the token, click **Authorize**)

Demo accounts (created automatically on first start): `alice@swift` and `bob@swift`, each with ₹10,000.00. Password for both: `password123`.

## Design notes
- **Palette:** HSBC Red `#EE3524` for primary actions, Black `#231F20` for the app background and White `#FFFFFF` for text and positive balances.
- **Product patterns, not a dashboard:** mobile-first shell with a bottom tab bar and a raised Pay button (sidebar on desktop), a step-by-step pay flow (find person, confirm name, keypad, review sheet, receipt), a card screen with instant controls, and an activity feed grouped by day with a receipt for each payment.
- **Plain language in the product UI:** developer terms (idempotency keys, Redis) live only under Profile -> Developer tools.
- **Money typography:** whole rupees are large and the paise are smaller, with tabular figures so columns line up. Positive balances use white; failed payments use red.
- **Type:** Inter (loaded from Google Fonts with a system-font fallback, so the app still works offline).
- **Accessibility basics:** visible keyboard focus, labelled controls, `aria-live` for toasts and lookups, `prefers-reduced-motion` respected.

## 3. What to try in the app

The app is built like a real payments product (mobile-first with a bottom tab bar, sidebar on desktop):

- **Home:** balance (hide it with the eye icon), quick actions, "Send again" people, recent activity, card status and this month's spending.
- **Send money:** enter a handle, **confirm the person's name**, type the amount on the keypad, review, pay, then get a receipt screen with a transaction ID.
- **Card:** freeze/unfreeze instantly, set a per-payment limit (slider or presets), reveal the CVV. Try paying while frozen, or above the limit: the payment is declined and recorded as *Failed* in your activity.
- **Activity:** payments grouped by day, with search, Sent/Received filters and a receipt for each payment ("Pay again" included).
- **Profile:** display currency (₹ / $ / €), privacy, log out, and **Developer tools**.

## 3b. Prove the safety features

**Double-payment protection:** Profile -> Developer tools -> **Run duplicate payment test**. Two identical requests with the same `Idempotency-Key` fire at the same moment. One is processed, the other is served from Redis, and your balance drops only once. (The normal pay flow also keeps one key per payment attempt, so retrying after a network error can never double-charge.)

**1,000-thread proof (JUnit):** with `docker compose` running:
```bash
cd backend
mvn test -Dtest=Swift1000ConcurrencyTest
```
It sends 1,000 simultaneous requests between Alice and Bob (800 unique payments + 200 duplicates sharing an Idempotency-Key) and asserts: zero errors, exactly 800 payments executed, exact expected balances, and total money still exactly ₹20,000.00.

> The test resets Alice and Bob to ₹10,000 before it runs and writes 800 ledger rows. Wipe everything any time with `docker compose down -v`.

## 4. API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | no | Create account + empty wallet |
| POST | `/api/auth/login` | no | Get a JWT |
| GET | `/api/wallets/me` | JWT | Balance, handle, card info |
| PATCH | `/api/wallets/card/freeze` | JWT | `{"frozen": true}` (empty body toggles) |
| PATCH | `/api/wallets/card/limit` | JWT | `{"limit": 5000}` |
| GET | `/api/users/lookup?handle=bob` | JWT | Resolve a handle to the account holder's name |
| POST | `/api/transfers` | JWT + `Idempotency-Key` header | `{"receiverHandle":"bob@swift","amount":250.00,"note":"Dinner"}` (note optional) |
| GET | `/api/transactions` | JWT | Your ledger (sent + received) with counterparty names and notes |
| GET | `/api/health` | no | Postgres + Redis status |

`POST /api/transfers` returns **200** on success and **422** when rejected (frozen card, over limit, insufficient balance). The body is the same shape for both.

## 5. How the money stays safe (great interview material)

1. **Idempotency (Redis).** `SET key PROCESSING NX` atomically claims `swift:idempotency:{userId}:{key}`. The winner runs the payment and stores the JSON response for 24h. Any duplicate, even one arriving at the same millisecond, waits for that response and returns it. If the payment throws, the key is deleted so a safe retry is possible.
2. **Pessimistic locking (PostgreSQL).** `SELECT ... FOR UPDATE` on both wallets so two payments can never read the same old balance.
3. **Deadlock-free ordering.** Locks are always taken lowest wallet id first. Alice->Bob and Bob->Alice at the same instant queue up instead of deadlocking.
4. **One database transaction.** Debit, credit and ledger row commit together or not at all. `@Version` on `Wallet` is an extra optimistic-lock safety net.
5. **Rejections are ledger rows.** Frozen/limit/balance failures are saved as `FAILED` and returned normally (not thrown), so the audit trail is not rolled back.
6. **Kafka after commit.** The `TransferCompletedEvent` is published with `@TransactionalEventListener(AFTER_COMMIT)`, so we never announce a payment that was rolled back, and a Kafka outage can never undo a committed payment. Receipts are logged by a `@KafkaListener` on `swift-notifications`.
7. **Stateless JWT.** No sessions. The caller's id comes from the signed token on every request.

## 6. Project layout

```
swift/
├── docker-compose.yml
├── backend/   (com.swift: entity, repository, dto, security, service, controller, event, config, exception)
└── frontend/  (src/pages: Home, Send, Card, Activity, Profile, Login · src/components: Shell, Sheet, TxRow, CardVisual, ...)
```

## 7. Honest simplifications (mention these in interviews)
- The CVV is stored in plain text **only to demo the eye-toggle**. Real systems never store a CVV.
- Currency toggle (₹, $, €) changes the *display* using fixed indicative rates; all balances settle in ₹.
- `ddl-auto: update` creates tables automatically. Production would use Flyway migrations.
- The JWT secret is in `application.yml` for convenience. Production would use an environment variable or secret manager.
- New accounts start at ₹0.00; only the two seeded demo accounts are pre-funded.
- There is no PIN/OTP step before paying. A production app would require biometric/PIN confirmation.
