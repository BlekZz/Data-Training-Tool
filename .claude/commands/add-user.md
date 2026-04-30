Add a new user entry to `scripts/managed_users.json` for global push maintenance.

The user will provide some combination of: name/label, email, and GAS project URL or script ID.

Steps:
1. Extract the script ID — if a URL is provided in the format `https://script.google.com/u/{n}/home/projects/{scriptId}`, extract the `{scriptId}` segment after `/projects/`.
2. Read the current `scripts/managed_users.json`.
3. Check for duplicates — if the script ID already exists in the list, tell the user and do not add.
4. Append the new entry to the `managed_scripts` array using this structure:
   ```json
   {
     "id": "<scriptId>",
     "label": "<name>",
     "email": "<email>"
   }
   ```
5. Write the updated file.
6. Print a confirmation showing the full updated list of managed scripts (label + email + id).

Do not run a push — only update the list.
