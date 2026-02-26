# PaymentService — Detaljan pregled

## 1. Arhitektura i struktura

PaymentService je **.NET 8 Web API** mikroservis koji upravlja **plaćanjima** u sistemu za trening centar. Koristi **PostgreSQL** bazu (`payment_db`) i **Stripe** kao eksterni payment procesor za kartice.

**Folderska struktura:**

| Folder | Uloga |
|---|---|
| `Models/` | Entitet `Payment` i enumovi |
| `Models/DTO/` | Data Transfer Objekti za API |
| `Context/` | EF Core DbContext (PostgreSQL) |
| `Data/` | Repository pattern — sva biznis logika |
| `Controllers/` | REST API endpointi |
| `ServiceCalls/` | Komunikacija sa drugim servisima |
| `Profiles/` | AutoMapper profili |

---

## 2. Model podataka

**`Payment` entitet** (`Models/Payment.cs`):

| Polje | Tip | Opis |
|---|---|---|
| `Id` | Guid | Primarni ključ |
| `Amount` | decimal | Iznos plaćanja |
| `PaymentDate` | DateTime | Datum plaćanja |
| `Method` | PaymentMethod (enum) | Način plaćanja |
| `Status` | PaymentStatus (enum) | Status plaćanja |
| `ServiceId` | Guid | ID servisa/paketa koji se plaća |
| `StripePaymentIntentId` | string? | Stripe payment intent ID (za kartice) |

**Enumovi:**

- `PaymentMethod`: **Card (0)**, **BankTransfer (1)**, **Cash (2)**
- `PaymentStatus`: **Pending (0)**, **Completed (1)**, **Failed (2)**, **Refunded (3)**

**Dozvoljene tranzicije statusa:**

```
Pending → Completed ✓
Pending → Failed ✓
Completed → Refunded ✓
(sve ostalo) → ✗
```

---

## 3. API Endpointi (PaymentController)

Svi endpointi zahtijevaju **JWT autentikaciju** (`[Authorize]`):

| Metoda | Ruta | Role | Šta radi |
|---|---|---|---|
| `GET` | `/api/Payment` | Admin, Receptionist | Lista svih plaćanja |
| `GET` | `/api/Payment/{id}` | Admin, Receptionist, Member | Jedno plaćanje po ID-ju |
| `POST` | `/api/Payment` | Admin, Receptionist, Member | **Kreira novo plaćanje** (i Stripe intent ako je kartica) |
| `PUT` | `/api/Payment/{id}` | Admin, Receptionist, Member | Ažurira status (Pending→Completed itd.) |
| `POST` | `/api/Payment/{id}/refund` | Admin, Receptionist | Refundira plaćanje |
| `DELETE` | `/api/Payment/{id}` | Admin | Briše plaćanje |

---

## 4. Ključni tok: Kako plaćanje karticom radi (end-to-end)

### Dijagram komunikacije

```
┌─────────────┐     ┌──────────────────┐     ┌──────────┐     ┌─────────────┐
│   Frontend   │────▶│  PaymentService  │────▶│  Stripe  │     │ LoggerSvc   │
│  (React)     │◀────│  (.NET API)      │◀────│  API     │     │             │
└─────────────┘     └──────────────────┘     └──────────┘     └─────────────┘
                           │                                        ▲
                           │           ┌──────────────┐             │
                           └──────────▶│ ServiceSvc   │    (loguje svaku akciju)
                                       │ (validacija) │
                                       └──────────────┘
```

### Korak po korak:

#### Korak 1 — Korisnik bira paket na frontu (`Membership.tsx`)

```tsx
const handleUpgrade = async (pkg) => {
    const payment = await paymentService.createPayment({
        amount: pkg.price,           // cijena paketa
        paymentDate: new Date(),
        method: PaymentMethod.Card,  // 0 = kartica
        serviceId: pkg.packageId     // ID paketa iz MembershipService
    });
    // Dobija nazad clientSecret od Stripe-a
    setStripeSecret(payment.clientSecret);
    setPendingPaymentId(payment.paymentId);
};
```

#### Korak 2 — Frontend šalje `POST /api/Payment` (`paymentService.ts`)

- Fetch poziv sa JWT tokenom u `Authorization` headeru
- Šalje `PaymentCreationDTO` (amount, date, method, serviceId)

#### Korak 3 — Backend prima zahtjev (`PaymentRepository.cs`)

1. **Poziva ServiceService** da provjeri da li `ServiceId` postoji (validacija, za sada samo log warning ako ne nađe)
2. Kreira `Payment` entitet sa statusom `Pending`
3. **Ako je method = Card**: Poziva **Stripe API** (`CreatePaymentIntentAsync`) koji:
   - Kreira PaymentIntent na Stripe-u
   - Vraća `PaymentIntentId` i `ClientSecret`
4. Čuva `StripePaymentIntentId` na payment entitetu
5. Sprema u PostgreSQL bazu
6. Vraća `PaymentConfirmationDTO` sa **`clientSecret`** za front

#### Korak 4 — Frontend otvara Stripe modal (`StripePaymentModal.tsx`)

- Prima `clientSecret` od backend-a
- Renderuje `<Elements>` wrapper sa Stripe.js
- Prikazuje `<CardElement>` — Stripe-ov siguran input za karticu
- Korisnik unosi podatke kartice **direktno u Stripe** (podaci kartice NIKAD ne dođu na naš server!)

#### Korak 5 — Stripe potvrda (`StripePaymentModal.tsx`)

```tsx
const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement }
});
if (result.paymentIntent.status === 'succeeded') {
    onSuccess();
}
```

#### Korak 6 — Nakon uspješne uplate (`Membership.tsx`)

1. `paymentService.updatePaymentStatus(paymentId, Completed)` → `PUT /api/Payment/{id}`
2. `membershipService.createMembership(...)` → Kreira membership zapis u **MembershipService**
3. Refreshuje stranicu sa novim podacima

---

## 5. Povezanost sa drugim servisima

PaymentService komunicira sa **3 druga servisa**:

### A) ServiceService (sinhrono, HTTP GET)

- Fajl: `ServiceCalls/ServiceService/ServiceService.cs`
- Poziva: `GET /api/service/{id}`
- **Zašto**: Kad se kreira payment, provjerava da li ServiceId (usluga koju korisnik plaća) zaista postoji
- URL iz konfiguracije: `http://service-service:8080/` (Docker) ili `https://localhost:7004/` (lokalno)

### B) LoggerService (asinhrono, HTTP POST, fire-and-forget)

- Fajl: `ServiceCalls/Logger/LoggerService.cs`
- Poziva: `POST /api/logger`
- **Zašto**: Svaka akcija u kontroleru se loguje (GetPayments, AddPayment, UpdateStatus, Refund, Delete...)
- `TryLogAsync` — nikad ne baca exception, samo loguje na konzolu ako logger ne radi
- URL: `http://logger-service:8080/` (Docker) ili `https://localhost:7025/` (lokalno)

### C) Stripe API (eksterni servis)

- Fajl: `ServiceCalls/Stripe/StripePaymentService.cs`
- `CreatePaymentIntentAsync(amount)` — kreira payment intent, vraća (id, clientSecret)
- `RefundPaymentAsync(intentId)` — refundira plaćanje
- Koristi Stripe .NET SDK sa API ključem iz konfiguracije

### D) AuthService (indirektno — JWT)

- PaymentService ne poziva AuthService direktno
- Ali **validira JWT tokene** koje je AuthService kreirao (dijeli isti `Jwt:Key` i `Jwt:Issuer`)
- Iz tokena čita role (`Admin`, `Receptionist`, `Member`) za autorizaciju

---

## 6. Povezanost sa frontom

Frontend komunicira sa PaymentService na portu **5219**:

| Frontend fajl | Šta radi |
|---|---|
| `src/services/paymentService.ts` | API klijent — `createPayment()` i `updatePaymentStatus()` |
| `src/components/payment/StripePaymentModal.tsx` | Stripe checkout modal sa `CardElement` |
| `src/pages/Membership.tsx` | Stranica za kupovinu paketa — koristi oba gore |
| `src/pages/admin/AdminPayments.tsx` | Admin pregled svih plaćanja — `GET /api/Payment` |

**Ključna tačka**: Frontend koristi `serviceId: pkg.packageId` — tj. prosleđuje **PackageId iz MembershipService-a** kao `ServiceId` u PaymentService. Komentar u kodu potvrđuje: *"Ovo je zapravo PackageId u kontekstu Membership-a"*.

---

## 7. Docker konfiguracija

Iz `docker-compose.yml`:

- **payment-db**: PostgreSQL 17 Alpine kontejner, port `5436:5432`
- **payment-service**: .NET 8 kontejner, port `5219:8080`
  - Zavisi od `payment-db`
  - Environment varijable override-uju `appsettings.json` za Docker mrežu
  - Koristi interne Docker URL-ove: `http://logger-service:8080/`, `http://service-service:8080/`

---

## 8. Dijagram kompletnog toka

```
Korisnik klikne "Buy Package"
         │
         ▼
   [Membership.tsx]  ──POST /api/Payment──▶  [PaymentController]
         │                                         │
         │                                   [PaymentRepository]
         │                                     │          │
         │                              Provjera servisa  Stripe API
         │                              (ServiceService)  (CreateIntent)
         │                                         │
         │            ◀── PaymentConfirmation ─────┘
         │             (clientSecret, paymentId)
         ▼
   [StripePaymentModal]
    Korisnik unosi karticu
    stripe.confirmCardPayment()
         │
         ▼  (uspješno)
   [Membership.tsx]
     │
     ├── PUT /api/Payment/{id}  ──▶ Status → Completed
     │
     └── POST /api/Membership   ──▶ [MembershipService] kreira članstvo
```

---

## 9. Rezime

PaymentService je **posrednik između fronta i Stripe-a** koji:

1. Čuva zapise o plaćanjima u svojoj PostgreSQL bazi
2. Komunicira sa **ServiceService** za validaciju usluga
3. Komunicira sa **LoggerService** za logovanje svake akcije
4. Koristi **Stripe SDK** za procesiranje karticnih plaćanja
5. Validira **JWT tokene** od AuthService-a za autentikaciju/autorizaciju
6. Frontend orkestrira čitav flow od kreiranja payment intent-a do finalizacije membership-a nakon uspješne uplate
