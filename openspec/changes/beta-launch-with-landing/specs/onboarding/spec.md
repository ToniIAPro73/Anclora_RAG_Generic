# Spec Delta: Onboarding Flow

## ADDED Requirements

### Multi-Step Onboarding Wizard

The system shall provide a guided 3-step onboarding wizard for new users to learn the product.

**Priority:** P0 (Critical for user activation)

#### Scenario: New user completes onboarding wizard

**Given** a user has just registered and logged in for the first time
**And** their onboarding_completed flag is FALSE
**When** they access the dashboard
**Then** an onboarding wizard modal is displayed
**And** the wizard shows step 1 of 3: "Sube tu primer documento"
**And** the wizard includes visual progress indicator (1/3, 2/3, 3/3)
**And** the user can proceed through all 3 steps sequentially
**And** upon completion, onboarding_completed is set to TRUE
**And** the wizard does not appear on subsequent logins

#### Scenario: User skips onboarding wizard

**Given** a new user sees the onboarding wizard
**When** they click the "Saltar" (Skip) button
**Then** the wizard closes immediately
**And** onboarding_completed is NOT set to TRUE
**And** the wizard reappears on their next login
**And** they can still use the application normally

#### Scenario: User completes all 3 onboarding steps

**Given** a user is in the onboarding wizard
**When** they complete step 1 (upload document)
**Then** the wizard automatically advances to step 2
**When** they complete step 2 (make query)
**Then** the wizard automatically advances to step 3
**When** they finish step 3 (explore features)
**Then** a success message is displayed
**And** onboarding_completed is set to TRUE in the database
**And** the wizard closes
**And** they see the full dashboard

### Step 1: Upload First Document

The first onboarding step shall guide the user to upload their first document.

**Priority:** P0 (Critical for activation)

#### Scenario: User completes document upload in onboarding

**Given** a user is on onboarding step 1
**When** the step displays
**Then** they see instructions: "Sube tu primer documento para empezar"
**And** they see a drag-and-drop zone or file picker
**And** they can select a PDF, DOCX, TXT, or MD file
**When** they upload a valid document
**Then** the ingestion process starts with progress indicator
**And** when ingestion completes, a success checkmark is shown
**And** the "Siguiente" (Next) button becomes active
**And** clicking Next advances to step 2

#### Scenario: User tries to skip step 1 without uploading

**Given** a user is on onboarding step 1
**And** they have not uploaded a document
**When** they try to click "Siguiente"
**Then** the button is disabled or shows a validation message
**And** they must upload a document to proceed

### Step 2: Make First Query

The second onboarding step shall guide the user to ask their first question.

**Priority:** P0 (Critical for activation)

#### Scenario: User makes first query in onboarding

**Given** a user has completed step 1 and is on step 2
**When** the step displays
**Then** they see instructions: "Haz tu primera pregunta sobre el documento"
**And** they see a chat input with placeholder text
**And** they see example questions they could ask
**When** they type a question and submit
**Then** the query is sent to the backend
**And** a loading indicator is displayed
**And** when the response arrives, it is shown with source citations
**And** a success checkmark is displayed
**And** the "Siguiente" button becomes active

### Step 3: Explore Features

The third onboarding step shall provide a quick tour of key features.

**Priority:** P1 (High for retention)

#### Scenario: User explores features in onboarding

**Given** a user has completed steps 1 and 2
**When** step 3 displays
**Then** they see a visual tour of key features:

- Document library view
- Chat history
- Settings panel
- Help/FAQ link
**And** they can click "Finalizar" to complete onboarding
**When** they click "Finalizar"
**Then** onboarding_completed is marked TRUE
**And** they see a congratulatory message
**And** the wizard closes

### Contextual Tooltips

The system shall display contextual tooltips on key UI elements for first-time users.

**Priority:** P2 (Medium for UX)

#### Scenario: User sees tooltips on hover

**Given** a user is using the dashboard
**When** they hover over a key UI element (upload button, chat input, source panel)
**Then** a tooltip appears with a brief hint (<20 words)
**And** the tooltip has an arrow pointing to the element
**And** the tooltip disappears after 3 seconds or when mouse leaves

#### Scenario: Tooltips are shown only to new users

**Given** a user has completed onboarding
**When** they hover over UI elements
**Then** tooltips are not shown (unless explicitly requested via help mode)

### Onboarding Video Tutorial (Optional)

The system may provide an embedded video tutorial for users who prefer video guidance.

**Priority:** P2 (Medium, optional enhancement)

#### Scenario: User watches onboarding video

**Given** a user is in the dashboard
**When** they click a "?" help icon or "Ver Tutorial" button
**Then** a modal opens with an embedded video (YouTube/Vimeo)
**And** the video is 60-90 seconds long
**And** the video demonstrates: upload → query → view citations
**And** the user can close the modal at any time

### Persistence and State Management

The system shall persist onboarding state across sessions.

**Priority:** P0 (Critical for UX)

#### Scenario: Onboarding state is persisted

**Given** a user starts the onboarding wizard
**When** they complete step 1 and close the browser
**And** they log in again later
**Then** the wizard resumes at step 2 (not step 1)
**And** the wizard remembers which steps were completed
**And** the user does not have to repeat completed steps

#### Scenario: Onboarding completion is recorded in database

**Given** a user completes all onboarding steps
**When** the wizard is finished
**Then** the users table is updated:

- onboarding_completed = TRUE
- onboarding_completed_at = current timestamp
**And** this state is consistent across all user sessions
**And** analytics event "onboarding_completed" is tracked

---

**Dependencies:**

- Users table with onboarding_completed and onboarding_completed_at columns
- Frontend modal/wizard component library
- Analytics tracking service

**Constraints:**

- Wizard must be non-blocking (user can skip or close)
- Each step must have clear success criteria
- Wizard must be responsive (mobile and desktop)
- Wizard state must persist in database, not just localStorage
