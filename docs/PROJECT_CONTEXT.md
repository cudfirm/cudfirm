# CUDFIRM Project Context

## Project Overview

CUDFIRM is my digital agency website.

The website is built with:

- HTML
- CSS
- Vanilla JavaScript
- Bootstrap 5
- Font Awesome

It is hosted on GitHub and deployed through Netlify.

The website must remain a static frontend that reads editable content from Supabase.

---

## Current Status

Phase 1 is COMPLETE.

The website is already connected to Supabase.

The CMS integration works.

Editing database content changes the website.

---

## Current Database

The following tables already exist.

- hero
- services
- navigation
- portfolio_projects
- testimonials
- faq

These tables are already connected.

Do not recreate them.

Do not rename them.

---

## Existing CMS Files

The project already contains:

- js/supabase.js
- js/cms-api.js
- js/cms-loader.js

These files are working.

Do not rewrite them unless absolutely necessary.

---

## Public Website

The public website already works correctly.

Do not redesign it.

Do not rewrite script.js.

Only extend the existing architecture.

---

## Goal

Build a professional Admin Dashboard that edits the existing Supabase tables.

The dashboard should be completely separate from the public website.

Changes made in the dashboard should update Supabase.

The public website should automatically display those changes.

---

## Technology

Use only:

- HTML
- CSS
- Vanilla JavaScript
- Bootstrap
- Supabase

Do not use:

- React
- Vue
- Angular
- NextJS
- TypeScript
- Tailwind

---

## Coding Rules

Analyze the project before modifying it.

Preserve all existing functionality.

Keep the code modular.

Prefer adding new files instead of rewriting existing ones.

Think before making architectural changes.

## Important

Before writing any code:

1. Analyze the entire project.
2. Read this document completely.
3. Inspect every HTML, CSS and JavaScript file.
4. Inspect the Supabase SQL files.
5. Explain your understanding of the current architecture.
6. Only then begin implementation.

Never assume anything.

If an existing implementation already works, extend it instead of replacing it.