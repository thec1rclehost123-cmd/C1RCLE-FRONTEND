# System Map

## Repository/package architecture

```mermaid
flowchart LR
  Guest[Guest Portal] --> BFF[Next.js BFF]
  Partner[Partner Dashboard] --> BFF
  Admin[Admin Console] --> API[API Gateway]
  Scanner[Scanner App] --> API
  BFF --> C[Shared Contracts]
  API --> C
  API --> Core[Backend Core]
```

## Domain flows

```mermaid
flowchart LR
  Guest --> Quote[Quote] --> Hold[Inventory Hold] --> Pay[Razorpay Test]
  Pay --> Callback[Callback/Webhook] --> Order[Order] --> Ticket[Entitlement]
  Callback --> Recovery[Recovery/Reconcile] --> Order
```

```mermaid
flowchart LR
  Venue --> Availability --> Request[Host Slot Request] --> Event[Event Creation]
  Event --> Attribution[Promoter Attribution] --> Commission[Commission]
  Order --> Journal[Balanced Journal] --> Refund[Refund/Chargeback]
```

```mermaid
flowchart LR
  Session[Auth Session] --> Org[Organization Membership] --> Role[Role Policy]
  Role --> Route[Route/API] --> Store[Firestore]
  Event --> Email[Outbox/Email] --> Guest
```

Deployment topology is configuration-defined for Vercel frontend targets, Render/backend targets, and Firebase/Firestore dependencies; no deployment was performed or validated.
