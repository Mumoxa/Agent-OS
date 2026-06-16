# GitHub Actions Workflows

## `ci.yml`

Runs on every pull request and push to `main`:

- Lints and type-checks the codebase
- Builds all Docker images
- Starts the docker-compose stack and runs E2E tests

## `deploy.yml`

Runs on every push to `main`:

- Builds Docker images for API, worker, and LLM router
- Rsyncs source files to the Oracle Cloud VM
- Decodes the `ENV_FILE` secret into `.env`
- Loads images on the VM and runs `docker compose up -d`
- Performs health checks

## Required secrets

| Secret | Description |
|---|---|
| `OCI_HOST` | Public IP or hostname of the Oracle VM |
| `OCI_USER` | SSH username, usually `ubuntu` |
| `OCI_SSH_KEY` | Private SSH key for the VM |
| `ENV_FILE` | Base64-encoded `.env` file |

## Encoding `.env` for GitHub secrets

```bash
base64 -i .env | pbcopy  # macOS
# or
base64 -w 0 .env        # Linux, copy output manually
```
