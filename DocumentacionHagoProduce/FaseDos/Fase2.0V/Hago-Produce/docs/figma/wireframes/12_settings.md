# Wireframe: Settings & Configuration

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Settings"
- **Sidebar:** Settings Sub-menu

## 1. Company Profile
- **Logo:** Upload Box (Preview current).
- **Basic Info:** Name, Slogan, Website.
- **Fiscal Data:**
  - Razon Social (Legal Name)
  - RFC
  - Fiscal Regime
  - Zip Code
  - CSD Certificates (Upload .cer and .key files for SAT stamping).

## 2. Users & Roles
- **List:** Table of system users.
- **Columns:** Name, Email, Role (Admin, Sales, Warehouse, Accountant).
- **Actions:** Invite User, Revoke Access.

## 3. System Preferences
- **Localization:** Timezone, Date Format, Default Currency.
- **Notifications:**
  - Email alerts for: New Orders, Low Stock, Payment Received.
  - In-app notifications toggle.

## 4. Integrations
- **SAT / PAC:** Connection status (Green/Red). Credits remaining.
- **Email Service:** SMTP Config or SendGrid/Resend API Key.
- **Storage:** AWS S3 / Vercel Blob config status.
- **Webhooks:** List of active webhooks (for Make.com/Zapier).

## 5. Data Management
- **Backup:** [Button] Download Data Archive.
- **Import:** Tools to import Clients/Products from CSV.
