# Spec Delta: Authentication

## MODIFIED Requirements

### JWT Authentication (Replacing AUTH_BYPASS)

The system shall implement production-ready JWT authentication replacing the development-only AUTH_BYPASS mode.

**Priority:** P0 (Critical - security blocker)

#### Scenario: User registers with valid credentials

**Given** a user has been invited from the waitlist
**When** they access the registration page and submit email + password
**Then** the backend validates the password meets requirements (min 8 chars)
**And** the password is hashed using bcrypt (cost factor 12)
**And** a new user record is created in the users table
**And** a JWT access token is generated with 24h expiration
**And** the response includes: access_token, token_type ("bearer"), and user object (without password)
**And** the user is automatically logged in

#### Scenario: User logs in with correct credentials

**Given** an existing user with email and password
**When** they submit credentials to POST /auth/login
**Then** the backend retrieves the user by email
**And** the password is verified against the stored hash
**And** a new JWT access token is generated
**And** the token includes claims: sub (user_id), email, role, exp (24h), iat, jti
**And** the response returns the token and user data

#### Scenario: User logs in with incorrect password

**Given** an existing user
**When** they submit an incorrect password to POST /auth/login
**Then** the password verification fails
**And** a 401 Unauthorized response is returned
**And** the error message is generic: "Invalid credentials" (no hint about email vs password)
**And** no token is generated

#### Scenario: User accesses protected endpoint without token

**Given** a user is not authenticated
**When** they attempt to access POST /ingest without Authorization header
**Then** the request is rejected with 401 Unauthorized
**And** the response includes WWW-Authenticate: Bearer header
**And** the error message indicates authentication is required

#### Scenario: User accesses protected endpoint with valid token

**Given** a user has a valid JWT token
**When** they send a request to POST /ingest with Authorization: Bearer {token}
**Then** the middleware decodes and validates the token
**And** the user object is attached to the request context
**And** the request proceeds to the endpoint handler

#### Scenario: User accesses protected endpoint with expired token

**Given** a user has a JWT token that expired
**When** they send a request with the expired token
**Then** the token validation fails with ExpiredSignatureError
**And** a 401 Unauthorized response is returned
**And** the error message indicates the token has expired
**And** the user must re-authenticate

### Password Reset Flow

The system shall provide a secure password reset mechanism.

**Priority:** P1 (High for user experience)

#### Scenario: User initiates password reset

**Given** a user has forgotten their password
**When** they submit their email to POST /auth/forgot-password
**Then** the system checks if the email exists
**And** if exists, a password reset token is generated (UUID, expires 1 hour)
**And** the token is sent via email with a reset link
**And** a 200 OK response is returned regardless of email existence (security)
**And** the response message is generic: "If the email exists, a reset link has been sent"

#### Scenario: User completes password reset

**Given** a user has received a password reset email
**When** they click the link and submit a new password
**Then** the backend validates the reset token (exists, not expired)
**And** the new password is validated (min 8 chars)
**And** the new password is hashed and stored
**And** the reset token is invalidated
**And** a success message is returned
**And** the user can log in with the new password

### User Roles and Limits

The system shall enforce role-based access control and beta user limits.

**Priority:** P0 (Critical for beta management)

#### Scenario: Beta user is created with default limits

**Given** a new user registers
**When** their account is created
**Then** their role is set to "beta_user" by default
**And** max_documents is set to 50
**And** max_queries_per_hour is set to 50
**And** onboarding_completed is set to FALSE

#### Scenario: Beta user exceeds document limit

**Given** a beta user has already uploaded 50 documents
**When** they attempt to upload a 51st document
**Then** the backend checks the document count for the user
**And** a 403 Forbidden response is returned
**And** the error message explains: "Beta limit reached: 50 documents maximum"
**And** the error includes a suggestion to upgrade or contact support

#### Scenario: Admin user bypasses beta limits

**Given** a user has role "admin"
**When** they upload documents or make queries
**Then** the beta limits are not enforced
**And** they have unrestricted access to all features

## REMOVED Requirements

### Development-Only AUTH_BYPASS

The AUTH_BYPASS mode used for local development shall be completely removed from production code.

**Priority:** P0 (Critical - security)

#### Scenario: AUTH_BYPASS is disabled in production

**Given** the application is deployed to production
**When** the environment variables are checked
**Then** AUTH_BYPASS is not set or is explicitly FALSE
**And** all protected endpoints require valid JWT authentication
**And** no mock users or fake tokens are accepted
**And** attempting to use AUTH_BYPASS logic results in authentication failure

---

**Dependencies:**

- python-jose[cryptography] for JWT
- passlib[bcrypt] for password hashing
- PostgreSQL users table
- Email service for password reset

**Constraints:**

- JWT tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Password minimum 8 characters
- Bcrypt cost factor: 12
- JWT secret must be 256-bit random key stored in env var
