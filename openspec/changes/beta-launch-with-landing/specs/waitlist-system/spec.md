# Spec Delta: Waitlist System

## ADDED Requirements

### Waitlist Registration

The system shall accept and store email addresses from interested users in a waitlist database.

**Priority:** P0 (Critical for beta launch)

#### Scenario: New user registers for waitlist

**Given** a user submits their email via the landing page form
**When** the POST /api/waitlist endpoint receives the request
**Then** the email is validated (format, not empty)
**And** the email is normalized (lowercased, trimmed)
**And** a new record is created in the waitlist table
**And** the record includes referral_source if provided
**And** a 201 Created response is returned with success message
**And** a confirmation email is sent asynchronously

#### Scenario: Duplicate email registration attempt

**Given** an email already exists in the waitlist table
**When** the same email is submitted again
**Then** the system detects the duplicate via unique constraint
**And** a 409 Conflict response is returned
**And** the response includes a friendly error message
**And** no duplicate database record is created
**And** no duplicate email is sent

#### Scenario: Invalid email format

**Given** a user submits an invalid email (e.g., "notanemail", "user@", "@domain.com")
**When** the POST /api/waitlist endpoint receives the request
**Then** the backend validates the email format
**And** a 400 Bad Request response is returned
**And** the response includes specific error: "Invalid email format"
**And** no database record is created

### Rate Limiting

The waitlist endpoint shall implement rate limiting to prevent abuse.

**Priority:** P0 (Critical for security)

#### Scenario: Normal user submits within rate limits

**Given** a user has not exceeded rate limits
**When** they submit an email to the waitlist
**Then** the request is processed normally
**And** the response includes rate limit headers:

- X-RateLimit-Limit: 5
- X-RateLimit-Remaining: 4
- X-RateLimit-Reset: [unix timestamp]

#### Scenario: User exceeds rate limit

**Given** a user has already made 5 requests in the last minute
**When** they attempt a 6th request
**Then** the request is rejected with 429 Too Many Requests
**And** the response includes Retry-After header
**And** the response body explains when they can retry
**And** no database operation is performed

### Email Confirmation

The system shall send automated confirmation emails to waitlist registrants.

**Priority:** P0 (Critical for user experience)

#### Scenario: User receives confirmation email

**Given** a user successfully registers for the waitlist
**When** the backend processes the registration
**Then** a confirmation email is sent via Resend API
**And** the email includes:

- Personalized greeting with their email
- Confirmation of waitlist registration
- Expected timeline for beta access
- Link to landing page for more info
**And** the email is sent within 2 minutes of registration
**And** if email sending fails, the error is logged but registration still succeeds

#### Scenario: Email service is unavailable

**Given** the Resend API is down or returns an error
**When** a user registers for the waitlist
**Then** the registration completes successfully (database insert)
**And** the email failure is logged with error details
**And** the user receives a 201 success response
**And** an alert is triggered for manual follow-up

### Invitation Management

The system shall allow administrators to invite waitlist users to the beta.

**Priority:** P1 (High for beta rollout)

#### Scenario: Admin invites user from waitlist

**Given** an admin is logged into the admin dashboard
**When** they select a user from the waitlist and click "Invite"
**Then** the user's invited flag is set to TRUE
**And** invited_at timestamp is recorded
**And** an invitation email is sent with registration link
**And** the email includes temporary access instructions
**And** the user is removed from the pending waitlist view

#### Scenario: Admin views waitlist metrics

**Given** an admin accesses the admin dashboard
**When** they navigate to the waitlist section
**Then** they see total waitlist count
**And** they see count of invited users
**And** they see count of pending users
**And** they see a list of users ordered by created_at (FIFO)
**And** they can filter by referral_source

### Database Schema

The system shall maintain a waitlist table with proper constraints and indexes.

**Priority:** P0 (Critical for functionality)

#### Scenario: Database schema is created

**Given** the database migration is executed
**When** the waitlist table is created
**Then** it includes columns: id (UUID PK), email (VARCHAR 255 UNIQUE NOT NULL), referral_source (VARCHAR 100), created_at (TIMESTAMP), invited (BOOLEAN DEFAULT FALSE), invited_at (TIMESTAMP)
**And** it includes a CHECK constraint on email format
**And** it includes indexes on: email (unique), created_at (DESC), invited (WHERE invited = FALSE)
**And** the table uses proper data types and constraints

---

**Dependencies:**

- PostgreSQL database
- Resend email service API
- Rate limiting middleware (slowapi or fastapi-limiter)

**Constraints:**

- Endpoint must be publicly accessible (no authentication required)
- Rate limit: 5 requests per minute per IP address
- Email must be sent within 2 minutes of registration
