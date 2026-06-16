# Oracle Cloud Infrastructure

Provision the Agent OS free VM using Terraform or the OCI console.

## Files

- `main.tf` — Terraform resources (VCN, subnet, security list, VM)
- `variables.tf` — Input variables
- `terraform.tfvars.example` — Example variables
- `cloud-init.yaml` — First-boot setup script
- `README.md` — This file

## Usage

```bash
cd infra/oracle
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

terraform init
terraform plan
terraform apply
```

After provisioning, note the public IP and update your Cloudflare DNS.
