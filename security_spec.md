# Firestore Security Specification

## Data Invariants
- A user can only access their own profile and activity history.
- The `isPlus` field and `totalSavings` should ideally be protected, but for this app, we'll allow the user to update their own stats for simplicity in this turn, while acknowledging that in a production app, savings might be calculated server-side or validated.
- User IDs must match the authenticated user's UID.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Try to create a user profile with a `userId` that doesn't match `auth.uid`.
2. **PII Leak**: Try to read another user's profile using their UID.
3. **Shadow Field**: Try to add an `isAdmin: true` field to the user profile.
4. **State Shortcutting**: Try to set `totalSavings` to a massive number without corresponding activity.
5. **Orphaned Activity**: Try to create an activity record for a user that doesn't exist.
6. **Resource Poisoning**: Try to use a 1MB string for a `displayName`.
7. **Cross-User Write**: Try to add an activity record to another user's subcollection.
8. **Impersonation**: Try to update the `email` field to someone else's email.
9. **Type Bomb**: Send a `string` for `totalSavings`.
10. **Negative Savings**: Send a negative number for `savings` in an activity record.
11. **Future Date**: Send a date that is in the future for an activity.
12. **Bulk Delete**: Try to delete the entire `users` collection.

## Rules Implementation Plan
- Use `rules_version = '2'`.
- Default deny all.
- Implement `isValidUser` and `isValidActivity` helpers.
- Use `request.auth.uid` comparison for all paths.
