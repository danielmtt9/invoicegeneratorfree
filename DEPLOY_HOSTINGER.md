# Deploy to Hostinger Shared Hosting

This repo is a Vite multi-page build + a small PHP/MySQL analytics backend.

## Build + Package

Create an uploadable bundle from `dist/`:

```bash
npm ci
npm run deploy:hostinger:package
```

Output:
- `tmp/deploy/hostinger-dist.zip` (preferred), or
- `tmp/deploy/hostinger-dist.tar.gz` (if `zip` is unavailable)

The archive contains the *contents* of `dist/` so it can be extracted directly into `public_html/`.

## Hostinger Setup

### 1) Upload site

Upload/extract into your site root:
- `public_html/`

After upload, these should exist:
- `public_html/index.html`
- `public_html/api/track.php`
- `public_html/admin/`
- `public_html/admin-api/`

### 2) Create MySQL DB + table

In Hostinger hPanel:
1. Create a MySQL database + user
2. Grant the user access to the DB
3. In phpMyAdmin, run:

```sql
CREATE TABLE events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vid VARCHAR(64) NOT NULL,
  event VARCHAR(64) NOT NULL,
  path VARCHAR(255) NOT NULL,
  referrer VARCHAR(255) NOT NULL DEFAULT '',
  ua VARCHAR(255) NOT NULL DEFAULT '',
  ip_hash CHAR(64) NULL,
  meta_json TEXT NOT NULL,
  INDEX idx_ts (ts),
  INDEX idx_event_ts (event, ts),
  INDEX idx_vid_ts (vid, ts),
  INDEX idx_ip_ts (ip_hash, ts),
  INDEX idx_path_ts (path, ts)
);
```

### 3) Configure PHP analytics

Edit on the server:
- `public_html/api/_config.php`

Set:
- `DB.host` (usually `localhost`)
- `DB.name` (Hostinger often prefixes it; use the full name)
- `DB.user` (full prefixed user)
- `DB.pass`
- `IP_HASH_SALT` (random string)

Host allowlist:
- Set `SITE_HOST` to your canonical host (recommended), OR
- Set `SITE_HOSTS` to allow both `example.com` and `www.example.com` if you haven’t set redirects yet.

### 4) Protect `/admin/` and `/admin-api/` with Basic Auth

The build includes:
- `public_html/admin/.htaccess`
- `public_html/admin-api/.htaccess`

Create an `.htpasswd` locally:

```bash
htpasswd -c .htpasswd admin@invoicegenerator.cloud
```

Upload `.htpasswd` to a safe absolute location on Hostinger (preferably outside `public_html/`).

Then edit both `.htaccess` files and set the correct absolute path:
- `AuthUserFile /home/<your_user>/.htpasswd`

### 5) Canonical host redirect (recommended)

Pick one canonical host and redirect the other to it. Example: redirect `www` to non-`www`.
Create/edit:
- `public_html/.htaccess`

```apache
RewriteEngine On

# Redirect www.example.com -> example.com
RewriteCond %{HTTP_HOST} ^www\.example\.com$ [NC]
RewriteRule ^ https://example.com%{REQUEST_URI} [R=301,L]
```

Adjust domains as needed.

### 6) Daily cleanup cron (90 days retention)

Endpoint:
- `/admin-api/cleanup.php?run=1`

Add a Hostinger Cron Job that runs daily. Example command:

```bash
curl -fsS -u "admin@invoicegenerator.cloud:YOUR_PASSWORD" "https://example.com/admin-api/cleanup.php?run=1" >/dev/null
```

## Quick Checks

1. `https://example.com/` loads
2. `https://example.com/admin/` prompts for Basic Auth
3. `https://example.com/admin-api/summary.php` prompts for Basic Auth and returns JSON after login
4. Events show up in the `events` table after browsing the site

