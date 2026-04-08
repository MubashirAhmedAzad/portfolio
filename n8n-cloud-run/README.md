# Deploy n8n on Google Cloud Run with Supabase

This guide walks you through deploying a self-hosted [n8n](https://n8n.io/) instance on **Google Cloud Run** using **Supabase** (PostgreSQL) as the database backend.

## Architecture overview

```
Browser / Webhook ──► Cloud Run (n8n container)
                              │
                              └──► Supabase (PostgreSQL)
```

- **Cloud Run** hosts the n8n container, auto-scales to zero when idle, and provides HTTPS automatically.
- **Supabase** provides a managed PostgreSQL database that n8n uses to store workflows, credentials, and execution history.
- **Google Secret Manager** stores all sensitive values (passwords, keys) so they never appear in source control.

---

## Prerequisites

| Tool | Minimum version | Install guide |
|------|----------------|---------------|
| `gcloud` CLI | latest | https://cloud.google.com/sdk/docs/install |
| Docker | 20+ | https://docs.docker.com/get-docker/ |
| A GCP project | – | https://console.cloud.google.com/ |
| A Supabase project | – | https://supabase.com/ |

Enable the required GCP APIs once:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

---

## Step 1 – Gather Supabase credentials

1. Open your Supabase project → **Project Settings → Database**.
2. Note down:
   - **Host** – e.g. `db.<project-ref>.supabase.co`
   - **Database name** – `postgres`
   - **User** – `postgres`
   - **Password** – your database password

---

## Step 2 – Store secrets in Google Secret Manager

Replace the placeholder values before running these commands.

```bash
PROJECT_ID=<your-gcp-project-id>
REGION=us-central1   # change to your preferred region

# Supabase database
echo -n "db.<project-ref>.supabase.co" | \
  gcloud secrets create n8n-db-host --data-file=- --project=$PROJECT_ID

echo -n "<supabase-db-password>" | \
  gcloud secrets create n8n-db-password --data-file=- --project=$PROJECT_ID

# Cloud Run service URL (update after first deploy – see Step 5)
echo -n "https://n8n-<hash>-<region>.a.run.app" | \
  gcloud secrets create n8n-host --data-file=- --project=$PROJECT_ID

# n8n basic-auth credentials
echo -n "admin" | \
  gcloud secrets create n8n-basic-auth-user --data-file=- --project=$PROJECT_ID

echo -n "<strong-password>" | \
  gcloud secrets create n8n-basic-auth-password --data-file=- --project=$PROJECT_ID

# Encryption key – generate one with: openssl rand -hex 32
echo -n "<32-byte-hex-string>" | \
  gcloud secrets create n8n-encryption-key --data-file=- --project=$PROJECT_ID
```

> **Tip:** These secret names match the `secretKeyRef` entries in `cloudrun.yaml`.  
> If you use different names, update `cloudrun.yaml` accordingly.

---

## Step 3 – Grant the Cloud Run service account access to secrets

```bash
# Get the default Compute Engine service account (used by Cloud Run)
SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

for SECRET in n8n-db-host n8n-db-password n8n-host \
              n8n-basic-auth-user n8n-basic-auth-password n8n-encryption-key; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID
done
```

---

## Step 4 – Update `cloudrun.yaml`

Open `cloudrun.yaml` and replace **`YOUR_PROJECT_ID`** with your actual GCP project ID:

```yaml
- image: gcr.io/YOUR_PROJECT_ID/n8n:latest
```

Also adjust `_REGION` in `cloudbuild.yaml` if you are not using `us-central1`.

---

## Step 5 – Build and deploy with Cloud Build

```bash
gcloud builds submit \
  --config=n8n-cloud-run/cloudbuild.yaml \
  --substitutions=_REGION=$REGION \
  --project=$PROJECT_ID \
  .
```

After the build finishes, retrieve the service URL:

```bash
gcloud run services describe n8n \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)'
```

Update the `n8n-host` secret with this URL:

```bash
echo -n "https://<service-url>" | \
  gcloud secrets versions add n8n-host --data-file=- --project=$PROJECT_ID
```

Then **redeploy** so n8n picks up the correct host:

```bash
gcloud builds submit \
  --config=n8n-cloud-run/cloudbuild.yaml \
  --substitutions=_REGION=$REGION \
  --project=$PROJECT_ID \
  .
```

---

## Step 6 – Open n8n

Navigate to the Cloud Run URL in your browser. You will be prompted for the basic-auth credentials you stored in Secret Manager (`n8n-basic-auth-user` / `n8n-basic-auth-password`).

---

## Local development

Use Docker Compose for local iteration (requires a `.env` file – copy from `.env.example`):

```bash
cd n8n-cloud-run
cp .env.example .env
# Fill in .env with real values
docker run --rm --env-file .env -p 5678:5678 n8nio/n8n
```

Open http://localhost:5678 in your browser.

---

## Security notes

- **Never commit `.env`** – it is listed in `.gitignore`.
- `cloudrun.yaml` sets `maxScale: 1` because n8n's default execution mode does not support running across multiple concurrent instances. To scale horizontally, enable [queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/) with Redis and increase `maxScale` accordingly.
- Rotate `N8N_ENCRYPTION_KEY` with care: changing it will invalidate all stored credentials.
- Consider restricting Cloud Run ingress to internal traffic + a load balancer if you don't need public webhooks.
- Enable [VPC connector](https://cloud.google.com/run/docs/configuring/vpc-connectors) and use Supabase's connection pooling (port 6543) for production workloads.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 502 Bad Gateway on startup | Container still initializing | Wait 30 s and refresh |
| `connect ECONNREFUSED` to Supabase | Wrong host/port or SSL not enabled | Check `DB_POSTGRESDB_HOST` and `DB_POSTGRESDB_SSL_ENABLED=true` |
| `password authentication failed` | Wrong Supabase password | Update `n8n-db-password` secret and redeploy |
| Workflows not persisting | Using wrong database type | Ensure `DB_TYPE=postgresdb` |
| Webhooks not working | `WEBHOOK_URL` mismatch | Set `WEBHOOK_URL` to the Cloud Run service URL |

---

## File reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds the n8n container image |
| `.env.example` | Template for all required environment variables |
| `cloudrun.yaml` | Cloud Run service definition (Knative spec) |
| `cloudbuild.yaml` | Cloud Build pipeline – build, push, deploy |
| `README.md` | This guide |
