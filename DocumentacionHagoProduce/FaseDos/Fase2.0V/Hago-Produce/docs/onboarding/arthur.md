# Onboarding Guide - Arthur (Security & Architecture)

## Welcome to Hago Produce!

This guide is tailored for the Security and Architecture review role.

## 🛡️ Responsibilities
- **Code Review:** Focus on security best practices (OWASP Top 10).
- **Architecture Validation:** Ensure adherence to C4 models and ADRs.
- **Compliance:** GDPR, PIPEDA (Canada), and local regulations.

## 🛠️ Tools Required
- **Git**
- **VS Code** with CodeQL extension (optional but recommended).
- **GitHub Access** (Reviewer permission).

## 🚀 Getting Started

1.  **Repository Access**
    - Clone the repo: `git clone <repo>`
    - Checkout `main` or specific feature branches for review.

2.  **Running Security Checks**
    ```bash
    # Run CodeQL analysis (if local CLI installed)
    codeql database create ...
    
    # Check dependencies for vulnerabilities
    npm audit
    ```

3.  **Reviewing Architecture**
    - Check `docs/architecture/` for current ADRs.
    - Validate new PRs against `docs/architecture/decision-log.md`.

## 📚 Key Documentation
- [Security Checklist](../security/checklist.md)
- [Architecture Review](../architecture/phase0-review.md)
- [Compliance Docs](../security/cra-compliance.md)
