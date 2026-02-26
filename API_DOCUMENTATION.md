# Home Backend API Documentation

**Base URL:** `/api` (e.g. `http://localhost:8000/api`)  
**Auth Base URL:** `/api/auth` (e.g. `http://localhost:8000/api/auth`)

**Authentication:** JWT (JSON Web Tokens) via `rest_framework_simplejwt`.  
Include the access token in the `Authorization` header for protected endpoints:

```
Authorization: Bearer <access_token>
```

**Token lifetimes (default):** Access: 1 day | Refresh: 7 days

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Properties](#2-properties)
3. [Availability & Calendar](#3-availability--calendar)
4. [Bookings](#4-bookings)
5. [Host Booking Management](#5-host-booking-management)
6. [Payments](#6-payments)
7. [Reviews](#7-reviews)
8. [Dashboards](#8-dashboards)
9. [Data Models Reference](#9-data-models-reference)
10. [Errors & Status Codes](#10-errors--status-codes)

---

## 1. Authentication

All auth endpoints are under `/api/auth/`.

### 1.1 Register

Create a new user and receive JWT tokens.

| | |
|---|---|
| **Endpoint** | `POST /api/auth/register/` |
| **Auth** | None (AllowAny) |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username |
| `email` | string | Yes | Unique email |
| `password` | string | Yes | Min length 6 |
| `phone` | string | No | Phone number |
| `user_type` | string | Yes | One of: `customer`, `owner`, `admin` |

**Response** `201 Created`:

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "",
    "avatar": null,
    "user_type": "customer"
  },
  "refresh": "<refresh_token>",
  "access": "<access_token>",
  "message": "User created successfully"
}
```

---

### 1.2 Login

Authenticate and receive JWT tokens.

| | |
|---|---|
| **Endpoint** | `POST /api/auth/login/` |
| **Auth** | None (AllowAny) |

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `password` | string | Yes |

**Response** `200 OK`:

```json
{
  "user": { "id": 1, "username": "johndoe", "email": "john@example.com", "phone": "", "avatar": null, "user_type": "customer" },
  "refresh": "<refresh_token>",
  "access": "<access_token>",
  "message": "Login successful"
}
```

**Error** `400 Bad Request`: `{"username": ["Invalid credentials"], ...}` or serializer field errors.

---

### 1.3 Logout

Invalidate current session (server-side session logout).

| | |
|---|---|
| **Endpoint** | `POST /api/auth/logout/` |
| **Auth** | Required (Bearer token) |

**Response** `200 OK`:

```json
{ "message": "Logout successful" }
```

---

### 1.4 Get / Update Profile

Retrieve or update the authenticated user's profile.

| | |
|---|---|
| **Endpoint** | `GET /api/auth/profile/` \| `PUT /api/auth/profile/` \| `PATCH /api/auth/profile/` |
| **Auth** | Required |

**Response** `200 OK` (GET): User object with fields `id`, `username`, `email`, `phone`, `avatar`, `user_type`.

**Request body (PUT/PATCH):** Any of `username`, `email`, `phone`, `avatar` (optional).

---

### 1.5 Refresh Token

Get a new access token using a valid refresh token.

| | |
|---|---|
| **Endpoint** | `POST /api/auth/token/refresh/` |
| **Auth** | None (use refresh token in body) |

**Request body (Simple JWT default):**

| Field | Type | Required |
|-------|------|----------|
| `refresh` | string | Yes | Valid refresh token |

**Response** `200 OK`:

```json
{ "access": "<new_access_token>" }
```

---

## 2. Properties

All property endpoints are under `/api/`.

### 2.1 List Properties

List all properties with optional filters, search, and ordering. Default: only `status=available`; default ordering: newest first.

| | |
|---|---|
| **Endpoint** | `GET /api/properties/` |
| **Auth** | None (AllowAny) |

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (default: `available`) |
| `property_type` | string | `apartment`, `house`, `condo`, `villa`, `studio` |
| `bedrooms` | int | Exact bedrooms |
| `bathrooms` | int | Exact bathrooms |
| `city` | string | City filter |
| `country` | string | Country filter |
| `min_price` | number | Min monthly price |
| `max_price` | number | Max monthly price |
| `has_wifi` | bool | Has WiFi |
| `has_parking` | bool | Has parking |
| `has_pool` | bool | Has pool |
| `has_gym` | bool | Has gym |
| `has_kitchen` | bool | Has kitchen |
| `furnished` | bool | Is furnished (filter may use `has_furnished` / `is_furnished` in backend) |
| `search` | string | Search in title, description, address, city |
| `ordering` | string | e.g. `daily_price`, `-monthly_price`, `created_at`, `-created_at`, `area`, `bedrooms` |

**Response** `200 OK`: Paginated list of property objects (see [Property object](#property-object)).

---

### 2.2 Create Property

Create a new property (authenticated user becomes owner).

| | |
|---|---|
| **Endpoint** | `POST /api/properties/` |
| **Auth** | Required |

**Request body:** Same fields as in [Property object](#property-object); `owner`, `created_at`, `updated_at` are read-only. Required for creation: `title`, `description`, `property_type`, `address`, `city`, `country`, `daily_price`, `area`. Optional: `monthly_price`, `currency`, `state`, `zip_code`, `latitude`, `longitude`, `bedrooms`, `bathrooms`, amenities booleans, `min_stay_months`, `max_stay_months`, `monthly_cycle_start`, `security_deposit_months`, `status`.

**Validation (examples):**

- `monthly_cycle_start`: 1–28  
- `min_stay_months`: ≥ 1  
- `max_stay_months`: if set, must be ≥ `min_stay_months`

**Response** `201 Created`:

```json
{
  "message": "Property created successfully",
  "property": { ... }
}
```

---

### 2.3 Get Property Detail

Retrieve a single property with full detail (includes bookings and reviews for GET).

| | |
|---|---|
| **Endpoint** | `GET /api/properties/<id>/` |
| **Auth** | None (AllowAny) |

**Response** `200 OK`: Property object with extra fields: `bookings` (next future bookings), `reviews` (recent), `average_rating`.

---

### 2.4 Update Property

Update a property. Only the owner can update.

| | |
|---|---|
| **Endpoint** | `PUT /api/properties/<id>/` \| `PATCH /api/properties/<id>/` |
| **Auth** | Required (owner only) |

**Request body:** Same as create; partial allowed for PATCH.

**Response** `200 OK`:

```json
{
  "message": "Property updated successfully",
  "property": { ... }
}
```

**Error** `403 Forbidden`: Not the property owner.

---

### 2.5 Delete Property (soft delete)

Remove property from listings (soft delete: status set to `maintenance`; pending bookings cancelled).

| | |
|---|---|
| **Endpoint** | `DELETE /api/properties/<id>/` |
| **Auth** | Required (owner only) |

**Response** `200 OK`:

```json
{ "message": "Property has been removed from listings" }
```

**Error** `403 Forbidden`: Not the property owner.

---

### 2.6 My Properties

List properties owned by the current user.

| | |
|---|---|
| **Endpoint** | `GET /api/properties/my/` |
| **Auth** | Required |

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `detailed` | bool | If set, use detail serializer (more fields) |

**Response** `200 OK`: List of property objects.

---

## 3. Availability & Calendar

### 3.1 Check Availability (POST)

Check if a property is available for given dates and get pricing summary.

| | |
|---|---|
| **Endpoint** | `POST /api/properties/<id>/check-availability/` |
| **Auth** | None (AllowAny) |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `check_in` | date (YYYY-MM-DD) | Yes | Check-in date (≥ today) |
| `check_out` | date (YYYY-MM-DD) | Yes | Must be after check_in |

**Response** `200 OK` (available):

```json
{
  "property_id": 1,
  "property_title": "Example Apartment",
  "available": true,
  "months": 12,
  "monthly_rate": "1500.00",
  "total_price": "15300.00",
  "discount": 15,
  "security_deposit": "3000.00"
}
```

**Error** `400 Bad Request`: Dates invalid or property not available (serializer/validation errors).

---

### 3.2 Check Availability (GET) – Quick summary

Get quick availability and pricing for the next 12 months (for calendar display).

| | |
|---|---|
| **Endpoint** | `GET /api/properties/<id>/check-availability/` |
| **Auth** | None (AllowAny) |

**Response** `200 OK`:

```json
{
  "property_id": 1,
  "property_title": "Example Apartment",
  "monthly_price": "1500.00",
  "min_stay_months": 12,
  "max_stay_months": null,
  "monthly_cycle_start": 1,
  "bookings": [
    { "check_in": "2025-03-01", "check_out": "2026-03-01", "status": "confirmed" }
  ]
}
```

---

### 3.3 Property Calendar (month)

Get day-by-day availability for a given month.

| | |
|---|---|
| **Endpoint** | `GET /api/properties/<id>/calendar/` |
| **Auth** | None (AllowAny) |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | int | current year | Year |
| `month` | int | current month | Month (1–12) |

**Response** `200 OK`:

```json
{
  "property_id": 1,
  "year": 2025,
  "month": 3,
  "month_name": "March",
  "calendar": [
    { "date": "2025-03-01", "available": true, "day_of_month": 1 },
    ...
  ],
  "booked_dates": [
    { "check_in": "2025-03-01", "check_out": "2026-03-01", "status": "confirmed" }
  ]
}
```

---

## 4. Bookings

### 4.1 Create Booking

Submit a booking request. Creates payment schedule (deposit + monthly rent) and sends notifications.

| | |
|---|---|
| **Endpoint** | `POST /api/bookings/` |
| **Auth** | Required |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `property` | int | Yes | Property ID (must be available) |
| `check_in` | date (YYYY-MM-DD) | Yes | Must be ≥ today; must match property’s `monthly_cycle_start` day |
| `check_out` | date (YYYY-MM-DD) | Yes | Must be > check_in; min/max months enforced |
| `guests` | int | No | Default 1 |
| `emergency_contact` | string | No | |
| `occupation` | string | No | |
| `special_requests` | string | No | |

**Validation (summary):**

- User cannot book own property.  
- Check-in must be on property’s `monthly_cycle_start` (e.g. 1st of month).  
- Stay length must be between property’s `min_stay_months` and `max_stay_months` (if set).  
- Property must be available for the date range.

**Response** `201 Created`:

```json
{
  "message": "Booking request submitted successfully",
  "booking": { ... },
  "next_steps": "Waiting for host confirmation"
}
```

**Error** `400 Bad Request`: Validation errors (e.g. property not available, dates invalid, self-booking).

---

### 4.2 My Bookings

List bookings for the current user.

| | |
|---|---|
| **Endpoint** | `GET /api/bookings/my/` |
| **Auth** | Required |

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `pending`, `confirmed`, `active`, `cancelled`, `completed`, `rejected` |
| `from` | date | check_in ≥ from |
| `to` | date | check_out ≤ to |

**Response** `200 OK`: List of booking objects.

---

### 4.3 Booking Detail

Get one booking (with payment schedule). Only the tenant can access.

| | |
|---|---|
| **Endpoint** | `GET /api/bookings/<id>/` |
| **Auth** | Required (tenant only) |

**Response** `200 OK`: Booking object plus `payments` array (payment schedule).

---

### 4.4 Update Booking

Update a pending booking (allowed fields: e.g. `emergency_contact`, `occupation`, `special_requests`, `guests`).

| | |
|---|---|
| **Endpoint** | `PUT /api/bookings/<id>/` \| `PATCH /api/bookings/<id>/` |
| **Auth** | Required (tenant only) |

**Error** `400 Bad Request`: Cannot modify non-pending booking.

---

### 4.5 Cancel Booking

Cancel a booking (tenant). Sets status to `cancelled`. Cannot cancel within 7 days of check-in for confirmed/active bookings.

| | |
|---|---|
| **Endpoint** | `DELETE /api/bookings/<id>/` |
| **Auth** | Required (tenant only) |

**Response** `200 OK`:

```json
{ "message": "Booking cancelled successfully" }
```

**Error** `400 Bad Request`: e.g. "Cannot cancel booking within 7 days of check-in."

---

## 5. Host Booking Management

### 5.1 List Host Bookings

List all bookings for properties owned by the current user.

| | |
|---|---|
| **Endpoint** | `GET /api/host/bookings/` |
| **Auth** | Required (host) |

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by booking status |
| `property` | int | Filter by property ID |

**Response** `200 OK`: List of host booking objects (include tenant name, email, phone, payments, rejection_reason, confirmed_at, cancelled_at).

---

### 5.2 Confirm or Reject Booking

Host confirms or rejects a pending booking.

| | |
|---|---|
| **Endpoint** | `PUT /api/host/bookings/<id>/confirm/` \| `PATCH /api/host/bookings/<id>/confirm/` |
| **Auth** | Required (host, only for own property’s pending bookings) |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `confirm` or `reject` |
| `reason` | string | No | Required for reject; shown to tenant |

**Response** `200 OK`:

```json
{
  "message": "Booking confirmed successfully",
  "booking": { ... }
}
```

Or for reject: `"message": "Booking rejected"`.

**Error** `400 Bad Request`: e.g. `{"action": "Must be 'confirm' or 'reject'"}`.

---

## 6. Payments

### 6.1 List Booking Payments

List all payments for a booking. Tenant or host can view.

| | |
|---|---|
| **Endpoint** | `GET /api/bookings/<id>/payments/` |
| **Auth** | Required (tenant or host for that booking) |

**Response** `200 OK`: List of payment objects (see [BookingPayment object](#bookingpayment-object)).

**Error** `403 Forbidden`: Not tenant or host.

---

### 6.2 Mark Payment as Paid

Mark a payment as paid (host or admin). Optional: set deposit as paid on booking when deposit payment is marked paid.

| | |
|---|---|
| **Endpoint** | `PUT /api/payments/<id>/mark-paid/` \| `PATCH /api/payments/<id>/mark-paid/` |
| **Auth** | Required (host of the property) |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transaction_id` | string | No | Reference for the payment |

**Response** `200 OK`:

```json
{
  "message": "Payment marked as paid",
  "payment": { ... }
}
```

---

## 7. Reviews

### 7.1 List Property Reviews

List reviews for a property. Public.

| | |
|---|---|
| **Endpoint** | `GET /api/properties/<id>/reviews/` |
| **Auth** | None (AllowAny) |

**Response** `200 OK`: List of review objects (see [PropertyReview object](#propertyreview-object)).

---

### 7.2 Create Review

Create a review for a **completed** booking. One review per booking; only the tenant of that booking can submit.

| | |
|---|---|
| **Endpoint** | `POST /api/bookings/<booking_id>/review/` |
| **Auth** | Required |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | int | Yes | 1–5 |
| `comment` | string | Yes | Review text |

**Response** `201 Created`:

```json
{
  "message": "Review submitted successfully",
  "review": { ... }
}
```

**Error** `400 Bad Request`: e.g. booking not found, not tenant, booking not completed, or already reviewed.

---

### 7.3 Host Respond to Review

Host adds or updates a response to a review.

| | |
|---|---|
| **Endpoint** | `PUT /api/reviews/<id>/respond/` \| `PATCH /api/reviews/<id>/respond/` |
| **Auth** | Required (host of the property) |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `host_response` | string | Yes | Non-empty response text |

**Response** `200 OK`:

```json
{
  "message": "Response posted successfully",
  "review": { ... }
}
```

---

## 8. Dashboards

### 8.1 Host Dashboard

Aggregated stats for the current user as host.

| | |
|---|---|
| **Endpoint** | `GET /api/dashboard/host/` |
| **Auth** | Required |

**Response** `200 OK`:

```json
{
  "properties": { "total": 5, "active": 4 },
  "bookings": { "total": 20, "pending": 2, "active": 3 },
  "revenue": { "total": "45000.00", "upcoming": "6000.00" },
  "recent_bookings": [ ... ]
}
```

---

### 8.2 Tenant Dashboard

Aggregated stats for the current user as tenant.

| | |
|---|---|
| **Endpoint** | `GET /api/dashboard/tenant/` |
| **Auth** | Required |

**Response** `200 OK`:

```json
{
  "bookings": {
    "total": 3,
    "active": 1,
    "pending": 0,
    "completed": 2
  },
  "upcoming_payments": "1500.00",
  "next_booking": { ... } | null,
  "recent_bookings": [ ... ]
}
```

---

## 9. Data Models Reference

### Property object

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | Read-only |
| `title` | string | |
| `address`, `city`, `state`, `country`, `zip_code` | string | |
| `description` | string | |
| `daily_price`, `monthly_price` | decimal | |
| `currency` | string | `ghs`, `usd`, `cfa` |
| `bedrooms`, `bathrooms`, `area` | int | |
| `property_type` | string | `apartment`, `house`, `condo`, `villa`, `studio` |
| `status` | string | `available`, `rented`, `maintenance` |
| `has_wifi`, `has_parking`, `has_pool`, `has_gym`, `is_furnished`, `has_kitchen` | boolean | |
| `min_stay_months`, `max_stay_months` | int | |
| `monthly_cycle_start` | int | 1–28 |
| `security_deposit_months` | decimal | |
| `latitude`, `longitude` | float \| null | |
| `images` | array | PropertyImage objects |
| `owner` | object | User (read-only) |
| `primary_image` | object \| null | |
| `monthly_price_display`, `security_deposit_display` | string/object | Display helpers |
| `amenities` | array of strings | e.g. WiFi, Parking |
| `created_at`, `updated_at` | datetime | Read-only |

### Booking object (tenant view)

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | |
| `property` | int (id) | On create |
| `property_title`, `property_address`, `property_image` | read-only | |
| `user`, `user_name`, `user_email` | read-only | |
| `check_in`, `check_out` | date | |
| `guests` | int | |
| `status` | string | `pending`, `confirmed`, `active`, `cancelled`, `completed`, `rejected` |
| `deposit_paid`, `deposit_paid_at`, `deposit_refunded`, `deposit_refunded_at` | various | Read-only |
| `created_at`, `updated_at` | datetime | Read-only |
| `payments` | array | Only on GET detail |

### BookingPayment object

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | |
| `booking` | int (id) | Read-only |
| `payment_type` | string | `deposit`, `rent`, `late_fee`, `utility`, `damage`, `refund` |
| `month_number` | int | 0 = deposit, 1+ = rent month |
| `amount` | decimal | |
| `due_date` | date | |
| `status` | string | `pending`, `paid`, `overdue`, `refunded`, `cancelled` |
| `paid_date` | date \| null | |
| `transaction_id` | string | |
| `notes` | string | |
| `is_overdue` | boolean | Computed |
| `created_at`, `updated_at` | datetime | Read-only |

### PropertyReview object

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | |
| `property`, `booking`, `user` | ids / read-only | |
| `rating` | int | 1–5 |
| `comment` | string | |
| `host_response` | string | |
| `host_responded_at` | datetime \| null | |
| `user_name`, `user_avatar` | read-only | |
| `created_at`, `updated_at` | datetime | Read-only |

---

## 10. Errors & Status Codes

| Code | Meaning |
|------|--------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation or business rule error; body has field errors or message) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (authenticated but not allowed) |
| 404 | Not Found |
| 500 | Server Error |

Validation errors are returned as JSON, e.g.:

```json
{
  "check_in": ["Check-in date cannot be in the past."],
  "check_out": ["Minimum stay is 12 months."]
}
```

---

## Quick Reference – All Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Register |
| POST | `/api/auth/login/` | No | Login |
| POST | `/api/auth/logout/` | Yes | Logout |
| GET/PUT/PATCH | `/api/auth/profile/` | Yes | Profile |
| POST | `/api/auth/token/refresh/` | No | Refresh access token |
| GET | `/api/properties/` | No | List properties |
| POST | `/api/properties/` | Yes | Create property |
| GET | `/api/properties/<id>/` | No | Property detail |
| PUT/PATCH | `/api/properties/<id>/` | Yes (owner) | Update property |
| DELETE | `/api/properties/<id>/` | Yes (owner) | Soft delete property |
| GET | `/api/properties/my/` | Yes | My properties |
| POST | `/api/properties/<id>/check-availability/` | No | Check availability (dates) |
| GET | `/api/properties/<id>/check-availability/` | No | Quick availability summary |
| GET | `/api/properties/<id>/calendar/` | No | Month calendar |
| POST | `/api/bookings/` | Yes | Create booking |
| GET | `/api/bookings/my/` | Yes | My bookings |
| GET | `/api/bookings/<id>/` | Yes (tenant) | Booking detail |
| PUT/PATCH | `/api/bookings/<id>/` | Yes (tenant) | Update booking |
| DELETE | `/api/bookings/<id>/` | Yes (tenant) | Cancel booking |
| GET | `/api/host/bookings/` | Yes (host) | Host bookings |
| PUT/PATCH | `/api/host/bookings/<id>/confirm/` | Yes (host) | Confirm/reject booking |
| GET | `/api/bookings/<id>/payments/` | Yes (tenant/host) | List payments |
| PUT/PATCH | `/api/payments/<id>/mark-paid/` | Yes (host) | Mark payment paid |
| GET | `/api/properties/<id>/reviews/` | No | Property reviews |
| POST | `/api/bookings/<booking_id>/review/` | Yes | Create review |
| PUT/PATCH | `/api/reviews/<id>/respond/` | Yes (host) | Host respond to review |
| GET | `/api/dashboard/host/` | Yes | Host dashboard |
| GET | `/api/dashboard/tenant/` | Yes | Tenant dashboard |

---

*Generated from home_backend (Django + Django REST Framework + Simple JWT).*
