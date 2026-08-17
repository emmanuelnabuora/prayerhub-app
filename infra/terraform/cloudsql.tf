# Cloud SQL for PostgreSQL 15 — 15+ is required for pgvector support.
# pgvector itself is enabled via the database flag below plus
# `CREATE EXTENSION vector;` in migration 0008_intelligence.sql, which the
# migrate step (see README) runs against this instance.

resource "google_sql_database_instance" "prayerhub" {
  name             = "prayerhub-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier

    database_flags {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.prayerhub_vpc.id
      # No authorized_networks block: with ipv4_enabled = false there is no
      # public IP at all, so there's nothing to authorize a range against.
      # Reachable only via the private VPC (Cloud Run, through the connector
      # in network.tf) or the Cloud SQL Auth Proxy for one-off migration runs.
    }
  }

  deletion_protection = true

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "prayerhub" {
  name     = "prayerhub"
  instance = google_sql_database_instance.prayerhub.name
}

resource "google_sql_user" "prayerhub_app" {
  name     = "prayerhub"
  instance = google_sql_database_instance.prayerhub.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

output "cloudsql_connection_name" {
  value = google_sql_database_instance.prayerhub.connection_name
}
