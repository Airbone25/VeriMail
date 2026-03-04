# Multi-Tenant Subscription Model Strategy

## Plan Differentiation

| Feature | **Free Plan** (1 Key per Org) | **Pro Plan** (Individual Keys) |
| :--- | :--- | :--- |
| **Key Limit** | `maxApiKeys: 1` | `maxApiKeys: 10` (or Unlimited) |
| **Logic** | **"Shared Key" model.** Only the Owner can generate the single available slot. | **"User Key" model.** Every team member can generate their own unique secret. |
| **Workflow** | Member must ask Owner for the key. Owner sends it via Slack/Email. | Member logs in and clicks "Generate My Key." No manual sharing needed. |
| **Security** | One key for everyone. If one person leaves, you must rotate the key for the entire company. | Individual keys. Revoke a single developer's access without breaking everyone else's code. |
| **Audit Logs** | All requests look the same (attributed to the Org). | Requests are attributed to the specific User/Key (Audit Trail). |

## Business Logic / Upgrade Incentives

1. **Free Tier (1 Key Per Org):**
   - **The Workflow:** The Owner generates the one and only key.
   - **The Result:** If the Member needs to use the API, the Owner must manually copy/paste the key to them.
   - **The Pain Point:** This is inconvenient and slightly insecure (sending secrets over Slack/Email).

2. **Pro Tier (Individual Keys):**
   - **The Workflow:** Every Member can go to the dashboard and click "Generate My Key."
   - **The Result:** No manual sharing is required. Every developer has their own secret.
   - **The Security:** If a developer leaves, you just revoke their key. You don't have to change the key for the entire company.

## Technical Implementation Notes

### Backend Changes (`routes/api.js`)
- Modify `POST /api-key` to allow non-owners to generate keys ONLY if the organization is on a Pro plan.
- Implement `maxApiKeys` enforcement based on `org.plan.maxApiKeys`.

### Frontend Changes (`client/app/dashboard/api-keys/page.tsx`)
- If user is NOT an owner AND plan is Free:
  - Mask the existing key.
  - Disable the "Generate Key" button.
  - Display a tooltip/message: *"Your organization is on the Free plan. Only the owner can manage the shared API key. Upgrade to Pro to generate your own individual developer key."*
