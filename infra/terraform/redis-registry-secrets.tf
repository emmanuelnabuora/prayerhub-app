# Memorystore for Redis — presence/caching/rate-limit backing store per
# docs/02-ARCHITECTURE.md section 1. Not yet wired into the NestJS app (the API
# currently talks to Postgres directly for everything, including the
# in-memory Throttler) — provisioned here so it's ready when that Redis
# integration is built, rather than adding infra and app code in the same PR.
resource "google_redis_instance" "prayerhub_cache" {
  name               = "prayerhub-cache"
  tier               = "BASIC"
  memory_size_gb     = 1
  region             = var.region
  authorized_network = google_compute_network.prayerhub_vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Docker image storage for the API and admin console images cloudbuild.yaml builds.
resource "google_artifact_registry_repository" "prayerhub" {
  location      = var.region
  repository_id = "prayerhub"
  format        = "DOCKER"
}

# Secret Manager entries referenced by cloudbuild.yaml's --set-secrets flag.
# Terraform creates the secret *containers*; populate actual values out of
# band (`gcloud secrets versions add ...` or the console) so real credentials
# never pass through a Terraform state file or version control.
resource "google_secret_manager_secret" "secrets" {
  for_each = toset([
    "prayerhub-database-url",
    "prayerhub-jwt-access",
    "prayerhub-jwt-refresh",
    "prayerhub-livekit-key",
    "prayerhub-livekit-secret",
    "prayerhub-anthropic-key",
    "prayerhub-voyage-key",
  ])
  secret_id = each.value
  replication {
    auto {}
  }
}

output "artifact_registry_repo" {
  value = google_artifact_registry_repository.prayerhub.name
}

# ---- Continuous deployment: GitHub push to main -> Cloud Build -> Cloud Run ----
#
# One-time manual step Terraform can't do for you: connect this GitHub repo to
# Cloud Build via the GCP Console (Cloud Build > Triggers > Connect Repository)
# or `gcloud builds connections create github` — OAuth app installation isn't
# expressible as a Terraform resource. Once connected, this trigger resource
# wires it to actually build and deploy on every push.
variable "github_owner" {
  type        = string
  description = "GitHub org/user that owns the PrayerHubApp repo"
  default     = ""
}
variable "github_repo" {
  type        = string
  description = "GitHub repo name"
  default     = ""
}

resource "google_cloudbuild_trigger" "deploy_on_push" {
  count       = var.github_owner != "" && var.github_repo != "" ? 1 : 0
  name        = "prayerhub-deploy-main"
  description = "Builds and deploys the API and admin console on every push to main"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "^main$"
    }
  }

  filename = "infra/cloudbuild.yaml"

  substitutions = {
    _REGION            = var.region
    _API_SERVICE       = "prayerhub-api"
    _ADMIN_SERVICE     = "prayerhub-admin"
    _CLOUDSQL_INSTANCE = google_sql_database_instance.prayerhub.connection_name
    _VPC_CONNECTOR     = google_vpc_access_connector.prayerhub_connector.name
    # _API_URL intentionally omitted here — it's the Cloud Run URL, which only
    # exists after the API's first deploy. Set it as a *substitution override*
    # in the Cloud Build trigger UI after that first deploy (Console > Cloud
    # Build > Triggers > edit this trigger > Substitution variables), rather
    # than baking a placeholder into source control that someone forgets to
    # update.
  }
}
