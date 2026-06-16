variable "tenancy_ocid" {
  description = "OCID of your OCI tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of your OCI user"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint of your OCI API key"
  type        = string
}

variable "private_key_path" {
  description = "Path to your OCI private API key"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_ocid" {
  description = "OCID of the compartment to create resources in"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "vm_name" {
  description = "Name of the VM"
  type        = string
  default     = "agent-os-free-vm"
}
