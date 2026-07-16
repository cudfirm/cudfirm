# 01 — Client Onboarding Checklist

Complete this checklist before adapting or deploying a template.

Do not begin implementation with an unclear brand name, unclear ownership, or incomplete content source.

## 1. Create the client project record

Record the following:

```text
Client/business name:
Public website brand name:
Legal business name, if different:
Stable template ID:
Delivery folder name:
Primary contact person:
Primary contact email:
Primary contact phone/WhatsApp:
Business address:
Target launch date:
CUDFIRM project owner:
```

### Naming decision

Confirm the exact public brand spelling and capitalization.

The approved name must later match:

- browser title;
- logo text and header;
- footer copyright;
- Site Settings;
- SEO title and description;
- dashboard branding;
- template manifest;
- starter database content;
- handover documents.

Do not use a template's placeholder brand after the client name is approved.

## 2. Confirm ownership and credits

Record:

```text
Website owner:
Website created by:
Required footer credit:
Copyright owner:
Domain owner:
Supabase project owner:
Netlify site owner:
Who pays hosting/usage costs:
```

Default CUDFIRM credit when contractually appropriate:

```text
Created by CUDFIRM Limited
```

The credit must be agreed before launch. Do not add or remove it without approval.

## 3. Define the website purpose

Write one approved sentence:

```text
This website helps ________________________________.
```

Then identify the main visitor actions:

- [ ] Contact the business
- [ ] Send a quote request
- [ ] Join a newsletter
- [ ] View services
- [ ] View projects/products
- [ ] Open WhatsApp
- [ ] Book an appointment
- [ ] Other: ______________________

## 4. Collect public business information

Collect and verify:

- [ ] Business name
- [ ] Email
- [ ] Phone
- [ ] WhatsApp number
- [ ] Address
- [ ] Business hours
- [ ] Social links
- [ ] Map URL or embed URL
- [ ] Logo
- [ ] Favicon
- [ ] Footer text
- [ ] Copyright text

Use one approved source of truth. Avoid entering different phone numbers or names in the database and static template files.

## 5. Collect content by CMS section

### Hero

- [ ] Eyebrow or label
- [ ] Main title
- [ ] Subtitle
- [ ] Primary action label and target
- [ ] Secondary action label and target
- [ ] Hero image
- [ ] Trust items

### About

- [ ] Main title
- [ ] Introduction
- [ ] Mission
- [ ] Story blocks
- [ ] Values
- [ ] Facts/statistics
- [ ] Image and alt text
- [ ] CTA

### Services

For each service:

- [ ] Title
- [ ] Description
- [ ] Price text, if used
- [ ] Icon/image
- [ ] Tags
- [ ] Featured/special status

### Portfolio, products or showcase

For each item:

- [ ] Title
- [ ] Image
- [ ] Category/industry
- [ ] Type
- [ ] Description/problem/solution
- [ ] Tags
- [ ] CTA destination
- [ ] Featured/live status

If the template needs fields not present in the stable contract, record the gap. Do not invent data or silently misuse unrelated fields.

### Testimonials

- [ ] Name
- [ ] Role/company
- [ ] Quote
- [ ] Avatar
- [ ] Permission to publish

### FAQ

- [ ] Question
- [ ] Answer

### Contact

- [ ] Section title and introduction
- [ ] Form labels
- [ ] Privacy note
- [ ] Direct-contact text
- [ ] Assurances

### SEO

- [ ] Homepage title
- [ ] Meta description
- [ ] Canonical URL
- [ ] Open Graph image
- [ ] Robots preference

## 6. Collect visual assets

- [ ] Logo in a web-safe format
- [ ] Favicon
- [ ] Hero image
- [ ] About image
- [ ] Showcase/product images
- [ ] Testimonial avatars
- [ ] Social preview image
- [ ] Proof that the client owns or may use the assets

Avoid depending on temporary third-party image URLs for final delivery. Client-owned images should be uploaded to the client's Media Library or approved storage.

## 7. Confirm template source

Select one:

- [ ] Existing CUDFIRM template
- [ ] New CUDFIRM template
- [ ] Client-supplied template

For a client-supplied template, record:

```text
Source ZIP name:
Original author/source:
License or permission:
Required sections:
Sections to remove:
Sections allowed to remain static:
Third-party libraries:
```

Ignore unnecessary metadata folders such as `__MACOSX` during integration.

## 8. Confirm dashboard users and roles

Record the initial users:

| User | Email | Intended role |
|---|---|---|
| Primary client administrator |  | Admin or Super Admin |
| Content editor |  | Editor |
| Read-only reviewer |  | Viewer |

Default recommendation:

- CUDFIRM retains a recovery Super Admin while support is active.
- The client receives the least-privileged role required for their work.
- Clients do not receive Supabase organization access by default.

## 9. Confirm deployment and billing

Record:

```text
Production domain:
Temporary Netlify URL:
Supabase project name:
Supabase organization:
Netlify account/site owner:
Who manages DNS:
Who receives billing alerts:
```

## 10. Approval gate

Do not proceed until these are approved:

- [ ] Exact public brand name
- [ ] Website purpose
- [ ] Required sections
- [ ] Contact information
- [ ] Ownership and footer credit
- [ ] Template choice and license
- [ ] Initial administrator email
- [ ] Separate Supabase project rule
- [ ] Expected launch domain

Approval record:

```text
Approved by:
Date:
Notes:
```
