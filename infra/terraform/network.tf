# Private networking for Cloud SQL and Memorystore — replaces the TEMPORARY
# public-IP config that shipped in the first pass of this infra. Cloud SQL and
# Redis both get private IPs on this VPC; only Cloud Run (via the VPC
# connector below) and the Cloud SQL Auth Proxy (for migrations) can reach
# them. Nothing is reachable from the public internet.

resource "google_compute_network" "prayerhub_vpc" {
  name                    = "prayerhub-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "prayerhub_subnet" {
  name          = "prayerhub-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.prayerhub_vpc.id
}

# Reserved IP range for Google-managed services (Cloud SQL, Memorystore) to
# peer into this VPC over private IP — required for private_network below.
resource "google_compute_global_address" "private_service_range" {
  name          = "prayerhub-private-service-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = google_compute_network.prayerhub_vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.prayerhub_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_range.name]
}

# Lets Cloud Run services reach the private VPC (and therefore private-IP
# Cloud SQL/Redis) — referenced from cloudbuild.yaml's Cloud Run deploy step
# via --vpc-connector.
resource "google_vpc_access_connector" "prayerhub_connector" {
  name          = "prayerhub-connector"
  region        = var.region
  network       = google_compute_network.prayerhub_vpc.name
  ip_cidr_range = "10.10.1.0/28" # separate, non-overlapping range from the subnet above
}

output "vpc_connector_name" {
  value = google_vpc_access_connector.prayerhub_connector.name
}
