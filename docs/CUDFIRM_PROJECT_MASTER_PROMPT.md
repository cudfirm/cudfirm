CUDFIRM PROJECT MASTER INSTRUCTIONS

PROJECT PURPOSE

CUDFIRM is not merely one website with an admin dashboard.

CUDFIRM is being developed as a reusable, template-agnostic CMS platform that can power:

1. Multiple ready-made website templates.
2. Templates created internally by CUDFIRM.
3. Templates supplied by clients.
4. Future client websites with different layouts and visual designs.

The CMS core, authentication, roles, database, Storage, messages, subscribers, SEO, backups, security, and dashboard should remain reusable.

Each public website template should connect to the reusable CMS through a template integration or adapter layer.

The goal is:

CUDFIRM CMS Core
→ Template Adapter
→ Any Compatible Website Template

Do not reduce the project to copying one CUDFIRM template for every client.

======================================================================
CURRENT BUSINESS OBJECTIVE
======================================================================

The next major objective is to build the CUDFIRM Template Integration Framework.

This framework must allow CUDFIRM to:

• Maintain multiple templates.
• Connect a client-supplied HTML/CSS/JavaScript template.
• Map template sections to existing CMS data.
• Reuse the same backend architecture.
• Avoid rebuilding authentication, dashboard, CRUD, roles, and security for every template.
• Support optional and template-specific sections.
• Keep client data isolated in separate Supabase projects where required.
• Create a predictable deployment and handover process.

The framework should eventually support:

• Hero
• About
• Services
• Portfolio
• Testimonials
• FAQ
• Navigation
• Contact content
• SEO
• Site settings
• Social links
• Media
• Optional custom sections

======================================================================
PROJECT HISTORY
======================================================================

The following major capabilities have already been implemented and tested:

FOUNDATION

• Responsive public website
• Supabase connection
• Public CMS rendering
• Contact form
• Newsletter subscription
• Hero image support
• Lightbox integration
• Thank-you flow

ADMIN DASHBOARD

• Authentication
• Hero management
• Services CRUD
• Portfolio CRUD
• Testimonials CRUD
• FAQ CRUD
• Navigation CRUD
• Media Library
• Site Settings
• SEO Manager
• Messages
• Subscribers
• Activity Log

CONTENT MANAGEMENT

• Search
• Filters
• Sorting
• Pagination
• Bulk actions
• Drag-and-drop ordering
• Draft, Published, Hidden, and Archived workflow

BUSINESS TOOLS

• Message management
• Subscriber management
• CSV export
• Dashboard analytics
• SEO health checks
• Site health scanner

PLATFORM TOOLS

• Backup and Restore
• User Roles and Permissions
• Maintenance Mode
• Theme and Custom Styling
• Security and Audit
• Release Notes
• Version 2.0.0 labeling

SECURITY

• RLS and API security hardening
• Role-aware database policies
• Public content restrictions
• Secure Activity Log RPC
• Security event logging
• Legacy public.content table quarantined
• Contact and newsletter public inserts verified
• RLS verification script passed
• Security Advisor reviewed
• Fresh secured backup downloaded

======================================================================
KNOWN ROADMAP DRIFT
======================================================================

The project previously drifted away from the original business plan.

Too much time was spent deepening one website installation before implementing the reusable template-integration system.

This work is still valuable because it created a strong CMS core.

However, future development must now prioritize:

1. Defining the CMS data contract.
2. Building the template adapter framework.
3. Connecting multiple templates.
4. Supporting client-supplied templates.
5. Creating fresh-install and deployment workflows.
6. Testing the system with a real second template.

Do not continue adding unrelated CMS features before the template framework unless a critical bug or security issue requires attention.

======================================================================
SECURITY RULES
======================================================================

RLS must remain enabled.

Never disable RLS to make development easier.

Never create broad policies such as:

using (true)

or unrestricted authenticated-user write policies unless the security requirement is explicitly proven.

The intended access model is:

ANONYMOUS VISITORS

May:

• Read published public content.
• Read public Hero, Site Settings, and SEO data required for rendering.
• Submit permitted Contact form fields.
• Submit a newsletter email.
• Load intended public media files.

May not:

• Read Messages.
• Read Subscribers.
• Read User Profiles.
• Read Activity Log.
• Read Security Events.
• Modify CMS content.
• Delete anything.
• Execute administrative actions.

VIEWER

• Read-only dashboard access to permitted content.
• No content modifications.
• No private operational data unless explicitly allowed.

EDITOR

• Create and edit content.
• Manage SEO and media where permitted.
• Publish or hide content.
• No critical deletes.
• No user management.
• No backups/restores.
• No security administration.

ADMIN

• Manage operational content.
• Manage Messages.
• Manage Subscribers.
• Manage Site Settings.
• Perform approved destructive content actions.
• Cannot control Super Admin permissions.

SUPER ADMIN

• Full authorized access.
• User and role management.
• Backup and restore.
• Security and audit tools.
• Critical system settings.

All important permissions must be enforced in PostgreSQL RLS and Storage policies, not only by hiding buttons in the dashboard.

======================================================================
INTENTIONAL SECURITY ADVISOR WARNINGS
======================================================================

The following functions intentionally remain SECURITY DEFINER and callable by the listed roles:

• record_auth_security_event(...)
  Required for failed and successful authentication-event logging.

• current_app_role()
  Required to identify the current signed-in user’s application role.

• has_permission(permission_name text)
  Required for role and permission checks.

• record_activity_event(...)
  Required for secure Activity Log recording using the real authenticated user.

Do not revoke EXECUTE or convert these functions to SECURITY INVOKER without a complete redesign and security review.

The Leaked Password Protection warning may remain while the Supabase project is on the Free plan.

======================================================================
PROTECTED FILES
======================================================================

These files are considered high risk:

• js/script.js
• css/styles.css

Do not modify, rewrite, refactor, rename, or reorganize them unless:

1. The requested feature genuinely requires it.
2. The exact relevant code has been inspected.
3. No isolated alternative is technically valid.
4. The user is clearly told before the change.
5. The change is minimal and tested.

Prefer adding isolated files such as:

• js/template-adapter.js
• js/theme-manager.js
• js/maintenance-mode.js
• css/theme-overrides.css
• template-specific adapter files

Do not change unrelated code while implementing a feature.

======================================================================
STABILITY RULE
======================================================================

If a feature already works, extend it.

Do not replace it.

Do not redesign it.

Do not rewrite it.

Do not refactor working code merely because it could look cleaner.

Every change should be the smallest safe change required.

======================================================================
WORKING METHOD
======================================================================

Work one task at a time.

For instructions that require the user to perform actions:

1. Give exactly one clear task.
2. Stop.
3. Wait for the user to return the result.
4. Inspect the result.
5. Then give the next task.

Do not provide ten installation steps at once when the user is actively performing security, Supabase, deployment, or migration work.

The user has explicitly requested one-step-at-a-time guidance.

======================================================================
CODE MODIFICATION PROCESS
======================================================================

Before modifying code:

1. Inspect the latest complete deployed ZIP.
2. Confirm the exact current architecture.
3. Identify the minimum files required.
4. State which files will be modified.
5. State which files will not be touched.

After modifying code:

1. Run JavaScript syntax checks.
2. Validate CSS where applicable.
3. Check local file references.
4. Confirm the patch contains only intended files.
5. Return a focused patch ZIP.
6. Explain the exact cause and exact fix.
7. Provide one-step-at-a-time installation instructions if requested.

Do not claim a test passed unless it was actually performed.

======================================================================
DATABASE MIGRATION RULES
======================================================================

Never rewrite migration history after a migration has been run.

If an old migration contains an incorrect default or policy:

• Keep the original migration unchanged.
• Create a new corrective migration.
• Use the next migration number.

Before running a migration:

• Back up the project.
• Download a CUDFIRM JSON backup.
• Confirm the correct project and environment.

Do not tell the user to rerun a migration unless it is explicitly idempotent and a rerun is necessary.

======================================================================
TEMPLATE INTEGRATION FRAMEWORK
======================================================================

The next major architecture should contain:

1. CMS DATA CONTRACT

Define the reusable data structure for:

• Hero
• About
• Services
• Portfolio
• Testimonials
• FAQ
• Navigation
• Contact
• SEO
• Site settings
• Social links
• Media
• Optional custom sections

2. TEMPLATE MANIFEST

Every template should declare:

• Template ID
• Template name
• Version
• Supported CMS sections
• Required fields
• Optional fields
• Section selectors or mounting targets
• Renderer functions
• Asset requirements
• Compatibility information

3. TEMPLATE ADAPTER

The adapter should map CMS records to a specific frontend template.

Example responsibilities:

• Insert Hero text into the correct element.
• Render Services using the template’s card markup.
• Render Portfolio using the template’s gallery structure.
• Bind Navigation data.
• Apply Contact and SEO data.
• Hide unsupported or empty sections safely.

4. CORE API LAYER

Templates should consume a stable API instead of directly duplicating Supabase logic.

The system should centralize:

• Data fetching
• Published-content filtering
• Error handling
• Loading states
• Empty states
• Media URL handling
• SEO application
• Settings application

5. TEMPLATE-SPECIFIC CODE

Template-specific files should control markup and presentation only.

They must not duplicate:

• Authentication
• Dashboard CRUD
• Role logic
• RLS logic
• Backup logic
• Security logic

======================================================================
TEMPLATE SUPPORT GOALS
======================================================================

The system must support:

• CUDFIRM’s current public design as Adapter 1.
• A second ready-made template as Adapter 2.
• A client-supplied template as the real integration test.

A template should not need to match the current CUDFIRM DOM structure.

The adapter layer should absorb those differences.

======================================================================
NEXT DEVELOPMENT ORDER
======================================================================

Follow this order unless a critical bug or security issue interrupts it:

1. Audit existing CMS fields and identify missing About/Contact content fields.
2. Define the CUDFIRM CMS data contract.
3. Define the template manifest format.
4. Build a shared template adapter runtime.
5. Convert the existing CUDFIRM website into Adapter 1.
6. Connect a second template as Adapter 2.
7. Connect a client-supplied template.
8. Build a fresh-install Supabase setup script.
9. Create client onboarding and deployment documentation.
10. Test the complete client-delivery workflow.

Do not skip directly to multi-site SaaS, billing, or advanced automation before proving the adapter framework with multiple templates.

======================================================================
COMMUNICATION RULES
======================================================================

Be direct and precise.

Do not overwhelm the user with multiple alternative approaches unless a decision is truly required.

Do not keep important information outside the main prompt or task.

When writing a prompt for another coding model, include:

• Project context
• Objective
• Allowed files
• Forbidden files
• Existing systems to preserve
• Exact expected behavior
• Testing requirements
• Output requirements

Do not say “we can add this later” after giving an incomplete implementation plan. Include the complete focused requirement upfront.

======================================================================
CURRENT PROJECT STATUS
======================================================================

CUDFIRM CMS Core: mature and working.

Version: 2.0.0.

RLS hardening: applied and functionally verified.

Public content: working.

Contact form: working.

Newsletter form: working.

Activity logging: working.

Security Advisor: 0 errors.

Backup after RLS hardening: downloaded.

CURRENT NEXT TASK:

Begin the CUDFIRM Template Integration Framework by auditing the existing database schema and dashboard fields, then define the CMS data contract.

Do not begin implementation until the latest project ZIP and relevant schema/migration files have been inspected.