# Deploying PrayerHubApp to GCP

This deploys `apps/api` (NestJS) and `apps/web-admin` (Next.js) to Cloud Run, backed by
Cloud SQL for Postgres (with pgvector) and Memorystore for Redis. `apps/mobile` does **not**
deploy to GCP — Expo/EAS ships that to the App Store and Play Store separately.

## Prerequisites
- `gcloud` CLI installed and authenticated: `gcloud auth login`
- Terraform installed
- A GCP project with billing enabled
- Enable required APIs once:
  ```bash
  gcloud services enable run.googleapis.com sqladmin.googleapis.com \
    redis.googleapis.com secretmanager.googleapis.com \
    artifactregistry.googleapis.com cloudbuild.googleapis.com
  ```

## 1. Provision infrastructure (Terraform)
```bash
cd infra/terraform
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID"
```
This creates: Cloud SQL (Postgres 15, pgvector enabled), Memorystore Redis, an Artifact
Registry repo, and empty Secret Manager entries for the API's secrets.

## 2. Populate secrets
Terraform creates the secret *containers* but never their values — put real credentials in
by hand so they never touch Terraform state or version control:
```bash
# DATABASE_URL uses a Unix socket path, not a TCP host:port — Cloud SQL now has no
# public IP (see infra/terraform/network.tf), so this is how both Cloud Run
# (via --add-cloudsql-instances, already in cloudbuild.yaml) and the local
# migration step below actually reach it.
CONNECTION_NAME=$(cd infra/terraform && terraform output -raw cloudsql_connection_name)
echo -n "postgres://prayerhub:PASSWORD@/prayerhub?host=/cloudsql/${CONNECTION_NAME}" | \
  gcloud secrets versions add prayerhub-database-url --data-file=-

echo -n "$(openssl rand -hex 32)" | gcloud secrets versions add prayerhub-jwt-access --data-file=-
echo -n "$(openssl rand -hex 32)" | gcloud secrets versions add prayerhub-jwt-refresh --data-file=-
echo -n "YOUR_LIVEKIT_API_KEY" | gcloud secrets versions add prayerhub-livekit-key --data-file=-
echo -n "YOUR_LIVEKIT_API_SECRET" | gcloud secrets versions add prayerhub-livekit-secret --data-file=-
echo -n "YOUR_ANTHROPIC_API_KEY" | gcloud secrets versions add prayerhub-anthropic-key --data-file=-
echo -n "YOUR_VOYAGE_API_KEY" | gcloud secrets versions add prayerhub-voyage-key --data-file=-
```
(Voyage/LiveKit/Anthropic keys are optional at deploy time — see each feature's Sprint doc
for what degrades gracefully without them: live rooms need LiveKit, the assistant needs
Anthropic, semantic search falls back to keyword search without Voyage.)

## 3. Run database migrations
Cloud SQL has no public IP (see infra/terraform/network.tf), so migrations run through the
**Cloud SQL Auth Proxy**, either from Cloud Shell (which has network access to your project)
or locally:
```bash
# Download the proxy: https://cloud.google.com/sql/docs/postgres/sql-proxy#install
CONNECTION_NAME=$(cd infra/terraform && terraform output -raw cloudsql_connection_name)
./cloud-sql-proxy "$CONNECTION_NAME" &

cd apps/api
export DATABASE_URL="postgres://prayerhub:PASSWORD@127.0.0.1:5432/prayerhub"
npm run migrate
```

## 4. Build and deploy via Cloud Build
```bash
gcloud builds submit --config infra/cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_API_SERVICE=prayerhub-api,_ADMIN_SERVICE=prayerhub-admin,_CLOUDSQL_INSTANCE=$(cd infra/terraform && terraform output -raw cloudsql_connection_name),_VPC_CONNECTOR=$(cd infra/terraform && terraform output -raw vpc_connector_name),_API_URL=https://prayerhub-api-PLACEHOLDER.run.app
```
First deploy: the admin console needs the API's URL at *build* time
(`NEXT_PUBLIC_API_URL` is inlined into the JS bundle, not read at runtime), but you won't
know the API's Cloud Run URL until after its first deploy. Run the API deploy step once,
grab its URL from `gcloud run services describe prayerhub-api --region=us-central1
--format='value(status.url)'`, then re-run the full pipeline with the real `_API_URL`.

## 5. Set up continuous deploys
Cloud Build can't create a GitHub OAuth connection via Terraform (it's a one-time manual
authorization) — connect the repo once, then Terraform manages the trigger itself:

1. In the GCP Console: **Cloud Build → Triggers → Connect Repository**, authorize GitHub,
   select this repo. (Or: `gcloud builds connections create github` + `gcloud builds
   repositories create` — see [Cloud Build's GitHub docs](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github)
   for the CLI flow.)
2. Re-run `terraform apply` with the repo identified:
   ```bash
   terraform apply -var="project_id=YOUR_PROJECT_ID" \
     -var="github_owner=YOUR_GITHUB_ORG" -var="github_repo=YOUR_REPO_NAME"
   ```
   This creates a trigger that builds and deploys both services on every push to `main`.
3. **After the API's first deploy** (step 4 above), set the real API URL as a substitution
   override on the trigger — Console → Cloud Build → Triggers → edit `prayerhub-deploy-main`
   → Substitution variables → `_API_URL` → the API's actual `*.run.app` URL. This is
   deliberately a manual one-time step rather than a value baked into `network.tf`, since the
   URL doesn't exist until after that first deploy and shouldn't live in source control as a
   guess that goes stale.

From here, every push to `main` rebuilds and redeploys both services automatically — no more
manual `gcloud builds submit` needed for routine changes.

## What isn't automated here
- **First super_admin bootstrap** — see `apps/api/scripts/bootstrap-super-admin.sql` and
  `docs/15-ADMIN-CONSOLE.md`; run it once against the deployed database after the first real
  admin registers.
- **Redis is provisioned on the private VPC but not yet wired into the app** — see the
  comment in `infra/terraform/redis-registry-secrets.tf`; the API currently uses in-memory
  rate limiting and talks to Postgres directly. Wiring `@nestjs/throttler`'s Redis storage
  and a presence layer is the natural next step once traffic justifies it.
- **Custom domains, CDN, and WAF** aren't configured — Cloud Run URLs work out of the box for
  testing; production should sit behind Cloud Load Balancing with a managed SSL cert and
  Cloud Armor rules.
- **Mobile app store deployment** — entirely separate from this GCP setup; see Expo's EAS
  Build/Submit docs.

## Networking (now private by default)
Cloud SQL and Redis have **no public IP** — both sit on a dedicated VPC
(`infra/terraform/network.tf`), reachable only via the VPC connector Cloud Run attaches
through (`--vpc-connector`, already in `cloudbuild.yaml`) or the Cloud SQL Auth Proxy for
one-off tasks like running migrations. There's nothing to further harden here before
production beyond the custom-domain/WAF item above.
