# API reference

All responses use `{ "success": true, "data": ... }`. Errors use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.
Private endpoints require `Authorization: Bearer <JWT>`.

## Authentication

### `POST /api/auth/register`

```json
{
  "fullName": "Rajan Kumar",
  "email": "rajan@example.com",
  "mobileNumber": "+919876543210",
  "password": "SecurePass1",
  "referralCode": "NEXA24"
}
```

Returns HTTP 201 with an access token and the public user profile.

### `POST /api/auth/login`

```json
{
  "email": "rajan@example.com",
  "password": "SecurePass1"
}
```

## Investments

### `POST /api/investments`

```json
{
  "amount": 100000,
  "planName": "Evergreen Growth",
  "durationDays": 180,
  "dailyRoiPercentage": 1
}
```

The amount is expressed in rupees. Financial values are converted to integer
paise before persistence.

### `GET /api/investments?page=1&limit=20`

Returns the authenticated user's paginated investments.

## Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/history?page=1&limit=20`

The summary returns total investments, daily and lifetime ROI, level income,
wallet balance, currency, and profile metadata.

## Referrals

- `GET /api/referrals/direct` — flat list of level-1 referrals
- `GET /api/referrals/tree` — nested downline tree used by the Network UI

Each tree node includes `id`, `fullName`, `referralCode`, `joinedAt`, `level`, and `children`.
The complete tree is limited to ten levels to bound response and query cost.

## Scheduler

### `GET /api/cron/daily-roi`

Requires `Authorization: Bearer <CRON_SECRET>`. Vercel Cron provides this
header automatically when `CRON_SECRET` is configured in the project.

## Health

### `GET /api/health`

Returns service availability without opening a database connection.
