# Module Template

This folder is a non-installed reference for new CUDFIRM modules.

Before using it:

1. Copy the folder and rename it to a stable, generic module ID.
2. Rename the manifest and registration globals.
3. Declare all migrations, tables, permissions, dependencies, dashboard pages, public components, backup scope, and contract namespace.
4. Add RLS and verification scripts with the module migrations.
5. Register the module locally before `js/module-runtime.js` initializes.
6. Add the module to a client only when it is included in that client's written scope.

Do not place client names in reusable module IDs.
