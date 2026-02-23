# Wireframe: Authentication

## 1. Login Screen (Common Entry)
**Layout:** Centered Card on Split Background (Brand Image Left / Form Right)

### Components
- **Logo:** Hago Produce (Top Center of Form)
- **Title:** "Welcome Back"
- **Tabs/Toggle:** [ Internal Staff ] [ Customer Portal ]

#### Internal Staff Tab
- **Input:** Email Address
- **Input:** Password
- **Link:** "Forgot password?"
- **Button:** "Sign In" (Primary, Full Width)
- **SSO Option:** "Sign in with Google/Microsoft" (Secondary)

#### Customer Portal Tab
- **Input:** Tax ID / RFC
- **Input:** Password / Access Code
- **Button:** "Access Portal" (Primary)
- **Helper Text:** "First time? Contact support to get your credentials."

## 2. Forgot Password
**Layout:** Centered Card (Minimal)

### Components
- **Title:** "Reset Password"
- **Text:** "Enter your email to receive a reset link."
- **Input:** Email Address
- **Button:** "Send Reset Link"
- **Link:** "Back to Login"

## 3. Set New Password (from Email Link)
**Layout:** Centered Card

### Components
- **Title:** "Create New Password"
- **Input:** New Password
- **Input:** Confirm Password
- **Requirements List:** (8+ chars, 1 number, 1 symbol) - dynamic validation.
- **Button:** "Update Password"

## Visual Notes
- **Background:** High-quality agriculture/produce image with dark overlay on the left side.
- **Form:** Clean, white background, ample padding (`p-8`).
- **Feedback:** Error messages appear inline below inputs (Red text).
