# Deployment

Production runs on one EC2 instance (ap-southeast-2) behind nginx at
https://production.khalidsyfullah.com.

## How a deploy works

1. Push or merge to `main`.
2. `deploy.yml` runs CI (`lint`, `typecheck`, `build`), then assumes an AWS role
   through GitHub OIDC (no stored AWS keys).
3. It runs `/usr/local/bin/orange-deploy <sha>` on the instance through AWS
   Systems Manager (no SSH, no open deploy port).
4. The server script builds the commit into `/var/www/orange/releases/<timestamp>`,
   points `/var/www/orange/current` at it, restarts the app with pm2, and
   health-checks `http://127.0.0.1:3000/`.
5. If the health check fails, the previous release is restored and the job fails.
   The last 5 releases are kept.
6. A final smoke test requests the public URL.

Pull requests run CI only (`ci.yml`).

## Layout on the server

| Path | Purpose |
|---|---|
| `/usr/local/bin/orange-deploy` | copy of `deploy/orange-deploy.sh` |
| `/var/www/orange/ecosystem.config.cjs` | copy of `deploy/ecosystem.config.cjs` |
| `/var/www/orange/releases/*` | built releases |
| `/var/www/orange/current` | symlink to the active release |
| `/var/www/orange/shared/.env` | optional runtime env vars, linked into each release |
| `/etc/nginx/sites-available/orange` | see `deploy/nginx/` (certbot adds HTTPS) |

If you change `deploy/orange-deploy.sh` or `deploy/ecosystem.config.cjs`, copy
them to the server; the workflow does not update them.

## One-time AWS setup for the workflow

1. Create the GitHub OIDC provider (once per account):
   `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Create the IAM role `orange-github-deploy` with `deploy/iam/trust-policy.json`
   as its trust policy and `deploy/iam/permissions-policy.json` as an inline policy.
3. In GitHub: Settings > Environments > `production`, and restrict deployment
   branches to `main`. The trust policy only accepts that environment.

GitHub now issues the OIDC `sub` claim with immutable owner and repository IDs
(`repo:Khalid-Syfullah@8851114/orange.io@1411524365:environment:production`),
so the trust policy lists that form as well as the plain-name form. If the
credentials step fails with "Not authorized to perform
sts:AssumeRoleWithWebIdentity", compare the `sub` in the CloudTrail
`AssumeRoleWithWebIdentity` event with the trust policy.

To use a different role, set the repository variable `AWS_DEPLOY_ROLE_ARN`.

## Rollback

Re-run the **Deploy** workflow on an older commit (Actions > Deploy > Run
workflow, choose the branch/ref), or on the server:

```bash
cd /var/www/orange
ls -1dt releases/*            # pick a previous release
ln -sfn "$PWD/releases/<timestamp>" current.tmp && mv -Tf current.tmp current
pm2 startOrReload ecosystem.config.cjs --update-env
```
