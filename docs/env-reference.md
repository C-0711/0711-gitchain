# Environment Variables Reference

## Required

| Variable       | Description                              | Example                                                                                 |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string             | `postgresql://gitchain:password@localhost:5440/gitchain`                                |
| `JWT_SECRET`   | Secret for JWT token signing (64+ chars) | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `API_KEY_SALT` | Salt for API key hashing                 | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`    |

## API Server

| Variable         | Default                                                             | Description                               |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `PORT`           | `3100`                                                              | API server port                           |
| `NODE_ENV`       | `development`                                                       | Environment (`development`, `production`) |
| `CORS_ORIGINS`   | `http://localhost:3000,http://localhost:3001,http://localhost:3100` | Comma-separated allowed CORS origins      |
| `JWT_EXPIRES_IN` | `7d`                                                                | JWT token expiry duration                 |

## Hub (Next.js)

| Variable              | Default                 | Description                         |
| --------------------- | ----------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3100` | Public API URL for browser requests |
| `PUBLIC_HUB_URL`      | `http://localhost:3001` | Hub URL for links in emails etc.    |

## Blockchain

| Variable              | Default                                      | Description                              |
| --------------------- | -------------------------------------------- | ---------------------------------------- |
| `GITCHAIN_WALLET_KEY` | —                                            | Private key for blockchain transactions  |
| `BLOCKCHAIN_NETWORK`  | `base-mainnet`                               | Network (`base-mainnet`, `base-sepolia`) |
| `BLOCKCHAIN_RPC_URL`  | —                                            | Custom RPC endpoint (defaults to public) |
| `BLOCKCHAIN_CONTRACT` | `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7` | ContentCertificate contract address      |

## Redis

| Variable    | Default                  | Description             |
| ----------- | ------------------------ | ----------------------- |
| `REDIS_URL` | `redis://localhost:6399` | Redis connection string |

## IPFS / Pinata

| Variable           | Default                        | Description                     |
| ------------------ | ------------------------------ | ------------------------------- |
| `PINATA_JWT`       | —                              | Pinata API JWT for IPFS pinning |
| `PINATA_GATEWAY`   | —                              | Custom Pinata gateway URL       |
| `IPFS_GATEWAY_URL` | `https://gateway.pinata.cloud` | IPFS gateway URL                |

## C2PA (Content Authenticity)

| Variable           | Default | Description                                       |
| ------------------ | ------- | ------------------------------------------------- |
| `C2PA_SIGNING_KEY` | —       | HMAC key for C2PA signing (auto-generated in dev) |

## Docker Compose

See `docker-compose.prod.yml` for full production configuration. Key services:

- **api**: Port 3100
- **hub**: Port 3001
- **postgres**: Port 5440
- **redis**: Port 6399

## Development Setup

```bash
# Copy example env
cp .env.example .env

# Generate secrets
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")" >> .env
echo "API_KEY_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# Start services
docker compose up -d postgres redis
pnpm install
pnpm dev
```
