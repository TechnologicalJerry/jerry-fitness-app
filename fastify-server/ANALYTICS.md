# Analytics & Reporting Architecture — Jerry Fitness App

This document outlines the architecture, taxonomy, event validation, privacy controls, background aggregation, reporting engine, and data warehouse migration strategy for Stage 15 Analytics.

## 🏗️ Architectural Overview

```
                APPLICATION
                     |
                     v
              Fastify Domain
                     |
            ┌────────┴────────┐
            │                 │
      Transaction DB      Event/Outbox
            │                 │
            │                 v
            │            BullMQ Workers
            │                 |
            │          Analytics Pipeline
            │                 |
            │        ┌────────┴─────────┐
            │        │                  │
            │    Aggregates        Analytics Store
            │        │                  │
            └────────┴──────────┬───────┘
                                |
                             Redis
                                |
                                v
                     Analytics / Reports
                                |
                       ┌────────┴────────┐
                       │                 │
                    User API          Admin API
```

To prevent the transactional database from becoming an analytics bottleneck, all raw event writes and aggregations are processed asynchronously via `AnalyticsStore` and BullMQ background workers.

---

## 📊 Analytics Event Taxonomy & Schema

Events are typed, versioned (`v1`, `v2`), and validated before ingestion.

### Event Format

```json
{
  "eventId": "evt_1788924150_abc123",
  "eventType": "WORKOUT_COMPLETED",
  "eventVersion": "v1",
  "userId": "55555555-6666-7777-8888-999999999999",
  "anonymousId": "anon_987",
  "sessionId": "sess_456",
  "timestamp": "2026-09-09T08:50:00.000Z",
  "source": "client",
  "platform": "web",
  "appVersion": "1.0.0",
  "metadata": {
    "durationMinutes": 45,
    "volumeKg": 1200,
    "primaryMuscleGroup": "Chest"
  }
}
```

### Supported Event Types

- **User**: `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT`, `PROFILE_COMPLETED`
- **Workout**: `WORKOUT_STARTED`, `WORKOUT_SET_COMPLETED`, `WORKOUT_COMPLETED`, `WORKOUT_SKIPPED`, `EXERCISE_VIEWED`, `EXERCISE_COMPLETED`, `WORKOUT_PLAN_STARTED`, `WORKOUT_PLAN_COMPLETED`
- **Nutrition**: `MEAL_LOGGED`, `RECIPE_VIEWED`, `RECIPE_SAVED`, `HYDRATION_LOGGED`
- **Goals & Social**: `GOAL_CREATED`, `GOAL_COMPLETED`, `CHALLENGE_JOINED`, `CHALLENGE_COMPLETED`, `ACHIEVEMENT_UNLOCKED`, `TRAINER_VIEWED`, `TRAINER_BOOKED`, `MESSAGE_SENT`
- **Monetization**: `SUBSCRIPTION_STARTED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELLED`
- **Discovery**: `MEDIA_VIEWED`, `SEARCH_PERFORMED`, `SEARCH_RESULT_SELECTED`, `RECOMMENDATION_VIEWED`, `RECOMMENDATION_ACCEPTED`, `RECOMMENDATION_REJECTED`

---

## 🛡️ Privacy & Sensitive Metadata Redaction

Metadata payloads undergo automated sanitization (`AnalyticsEventValidator`).
Sensitive keys matching patterns (`password`, `token`, `secret`, `creditcard`, `cardnumber`, `cvv`, `ssn`, `privatekey`) are automatically redacted to `[REDACTED]`.

---

## 🔒 Data Access Control (RBAC) & Scope

- **USER**: Access limited strictly to own analytics (`GET /api/v1/analytics/me`, `/fitness`, `/nutrition`, `/progress`, `/adherence`, `/trends`).
- **TRAINER**: Authorized access to client analytics (`GET /api/v1/analytics/trainer/clients`).
- **ADMIN / SUPER_ADMIN**: System platform metrics, revenue, engagement, content gaps, cohort retention (`GET /api/v1/admin/analytics/*`).

---

## 🏬 Data Warehouse Migration Strategy (`AnalyticsStore`)

The `AnalyticsStore` interface abstracts event ingestion and querying.
Initial implementation (`PostgresAnalyticsStore`) uses PostgreSQL facts & dimensions.
Future migration to ClickHouse, BigQuery, Snowflake, or Databricks requires only providing a new `AnalyticsStore` class implementation without altering application controllers or routes.
