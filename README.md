# FlowForge — Workflow Automation Builder

A React + TypeScript UI for building end-to-end process automations with up to 8 configurable steps. Reduces manual workflow setup time by ~3 hours per workflow.

## Features

- **8 step types** — Trigger, Filter, Transform, Notify, Integrate, Delay, Condition, Action
- **Inline configuration** — each step expands with type-specific fields (dropdowns, inputs)
- **Step simulation** — animate through each step sequentially to verify the flow
- **Save & manage** — save workflows, toggle active/paused, delete
- **Animated UI** — Framer Motion spring animations throughout, Slack-inspired dark theme

## Tech Stack

- React 18 + TypeScript
- Vite
- Framer Motion (animations)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173`

## Supabase Setup (backend)

FlowForge uses **Supabase** for the database and authentication. Workflows are
saved per-user with Row-Level Security, so each account only sees its own data.

### 1. Create a project
- Go to [supabase.com](https://supabase.com) → **New project**
- Wait for it to finish provisioning

### 2. Create the database table
- In your project, open **SQL Editor → New query**
- Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**
- This creates the `workflows` table, an `updated_at` trigger, and RLS policies

### 3. Add your credentials
- In Supabase: **Settings → API**, copy the **Project URL** and **anon public key**
- In the project root, copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local      # macOS/Linux
  copy .env.example .env.local    # Windows
  ```
- Fill in your values:
  ```
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-public-key
  ```
- **Restart the dev server** (`npm run dev`) so Vite picks up the env vars

### 4. (Optional) Disable email confirmation for faster testing
- **Authentication → Providers → Email** → turn off *"Confirm email"* if you want
  to sign in immediately after sign-up without checking your inbox

Once configured, the login screen lets you sign up / sign in, and saved
workflows persist to your Supabase database.

## Execution Engine (sending real notifications)

The **Run** button on a saved workflow calls a Supabase **Edge Function**
(`supabase/functions/run-workflow`) that runs each step in order and actually
sends a notification at the Notify step.

### 1. Install the Supabase CLI & link your project
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```

### 2. Deploy the function (public webhook — no JWT)
```bash
supabase functions deploy run-workflow --no-verify-jwt
```

### 3. Add an email provider secret (for real emails)
Sign up at [resend.com](https://resend.com) (free tier), grab an API key, then:
```bash
supabase secrets set RESEND_API_KEY=re_your_key
# optional: a verified sender, otherwise Resend's sandbox address is used
supabase secrets set FROM_EMAIL="FlowForge <you@yourdomain.com>"
```
For Slack notifications, create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) and:
```bash
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

> Without these secrets the engine still runs — it just reports a **DRY RUN**
> for the notify step instead of sending. Great for testing the flow first.

### 4. Try it
- Build a workflow with a **Notify** step (Channel: Email, Recipient: your email)
- Save it, go to **Saved**, click **Run**
- You'll see a step-by-step execution log; with `RESEND_API_KEY` set, the email
  actually lands in your inbox

### Triggering from outside (real webhook)
Any external system can fire a workflow by POSTing to the function:
```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/run-workflow \
  -H "Content-Type: application/json" \
  -d '{ "workflowId": "<uuid>", "payload": { "review": { "rating": "1" } } }'
```
The `payload` is the trigger data your **Filter** steps evaluate against.

> **Note:** `.env.local` is git-ignored — never commit your keys. The `anon`
> key is safe for the browser; RLS is what protects the data.

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Deploying to AWS Amplify

1. Push this repo to GitHub
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click **Host a web app** → connect your GitHub repo
4. Amplify auto-detects Vite — confirm these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Deploy — you get a public URL on every push to `main`

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx        # Landing page with hero and feature grid
│   ├── WorkflowBuilder.tsx # Main builder canvas
│   ├── StepCard.tsx        # Individual step card with expand/collapse
│   ├── StepConfig.tsx      # Per-step-type configuration fields
│   ├── StepPicker.tsx      # Step type palette popup
│   ├── SavedWorkflows.tsx  # Saved workflows list
│   └── Sidebar.tsx         # Navigation sidebar
├── data/
│   └── stepTemplates.ts    # Default config for each step type
├── styles/
│   └── app.css             # All styles (CSS variables, dark theme)
└── types/
    └── workflow.ts         # TypeScript types
```

## Step Types

| Step | Purpose |
|---|---|
| Trigger | Start the workflow on an event (webhook, schedule, email, form) |
| Filter | Route or block data based on field conditions |
| Transform | Reshape or reformat data (JSON, XML, CSV) |
| Notify | Send alerts via Email, Slack, SMS, Teams, Push |
| Integrate | Connect to Salesforce, HubSpot, Jira, GitHub, Stripe |
| Delay | Pause execution for seconds / minutes / hours / days |
| Condition | Branch the workflow with true/false logic |
| Action | Run a custom Node.js, Python, or Bash script |
