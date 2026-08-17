# PrayerHubApp — GCP infrastructure
#
# Provisions: Artifact Registry (Docker images), Cloud SQL for Postgres (with
# pgvector enabled — required by migration 0008_intelligence.sql), Memorystore
# for Redis (presence/caching per docs/02-ARCHITECTURE.md), and empty Secret
# Manager secrets that cloudbuild.yaml's Cloud Run deploy step references.
#
# Cloud Run services themselves are deployed by cloudbuild.yaml, not here —
# Terraform owns durable stateful infra (database, cache, registry, secrets);
# Cloud Build owns the app deploys, which change on every push and don't
# belong in a slower Terraform apply loop.

terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

variable "project_id" { type = string }
variable "region" {
  type    = string
  default = "us-central1"
}
variable "db_tier" {
  type    = string
  default = "db-custom-2-7680" # 2 vCPU / 7.5GB — adjust for your expected load
}
