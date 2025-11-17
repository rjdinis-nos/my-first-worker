# Cloudflare DDNS Worker

A Cloudflare Worker that implements a Dynamic DNS (DDNS) update service, allowing automatic updates of DNS records in Cloudflare when your IP address changes.

## Overview

This worker provides a compatible endpoint for DDNS clients (such as routers or update scripts) to automatically update Cloudflare DNS records. It implements the standard DDNS update protocol used by many services.

## Features

- **HTTPS Enforcement** - All connections must use HTTPS for security
- **HTTP Basic Authentication** - Uses standard authentication headers
- **Cloudflare API Integration** - Directly updates DNS records via Cloudflare API
- **Standard DDNS Protocol** - Compatible with most DDNS clients

## How It Works

1. **Authentication**: The worker extracts credentials from HTTP Basic Authentication headers
   - Username: Your domain name (zone name)
   - Password: Your Cloudflare API token

2. **Update Process**:
   - Accepts query parameters for the hostname and new IP address
   - Validates all required parameters
   - Finds the Cloudflare zone (domain)
   - Locates the specific DNS record
   - Updates the record with the new IP address

3. **Response**: Returns `good` on success (standard DDNS protocol response)

## API Endpoints

### Update DNS Record

**Endpoints:** `/nic/update` or `/update`

**Method:** GET or POST

**Authentication:** HTTP Basic Auth
- Username: Zone name (your domain)
- Password: Cloudflare API token

**Query Parameters:**
- `hostname` (required): The full DNS record to update (e.g., `home.example.com`)
- `ip` or `myip` (required): The new IP address

**Example Request:**
```bash
curl -u "example.com:your-api-token" \
  "https://your-worker.workers.dev/update?hostname=home.example.com&myip=1.2.3.4"
```

**Success Response:**
```
good
```

### Other Endpoints

- `/favicon.ico` - Returns 204 No Content
- `/robots.txt` - Returns 204 No Content
- All other paths - Returns 404 Not Found

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Development

### Run Tests
```bash
npm test
```

Run tests in watch mode during development - tests will automatically re-run when files change.

### Local Development Server
```bash
npm run dev
# or
npm start
```

This starts a local development server (typically at `http://localhost:8787/`) where you can test the worker locally before deploying.

### Run Tests Once (CI Mode)
```bash
npm test -- --run
```

## Deployment

### Deploy to Cloudflare Workers
```bash
npm run deploy
```

This will deploy your worker to Cloudflare. Make sure you're logged in with Wrangler first.

### Wrangler Authentication
First-time setup requires authentication:
```bash
npx wrangler login
```

### View Deployment Info
```bash
npx wrangler whoami
```

### View Logs
```bash
npx wrangler tail
```

Stream live logs from your deployed worker.

### Additional Wrangler Commands

View worker details:
```bash
npx wrangler deployments list
```

Delete a deployment:
```bash
npx wrangler delete
```

## Setup

1. **Create Cloudflare API Token**:
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create a token with `Zone:DNS:Edit` permissions for your domain

2. **Deploy Worker**:
   - Run `npm run deploy` to deploy this worker to your Cloudflare account
   - Note the worker URL (e.g., `https://your-worker.workers.dev`)

3. **Configure DDNS Client**:
   - Set update URL to: `https://your-worker.workers.dev/update`
   - Username: Your domain name (e.g., `example.com`)
   - Password: Your Cloudflare API token
   - Hostname: The DNS record to update (e.g., `home.example.com`)

## Error Responses

The worker returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Missing or invalid parameters
- **401 Unauthorized**: Invalid authentication credentials
- **404 Not Found**: Invalid endpoint
- **500 Internal Server Error**: Unexpected errors

## Security

- Enforces HTTPS connections only
- Uses HTTP Basic Authentication
- Validates all input parameters
- Cloudflare API token is passed securely via authentication headers

## Compatible DDNS Clients

This worker is compatible with most DDNS clients that support custom update URLs, including:
- DD-WRT routers
- pfSense
- OPNsense
- Linux ddclient
- Custom scripts

## License

This is a standard Cloudflare Worker implementation for DDNS updates.
