# Invoice Generator

Free invoice generator with no login and instant PDF download.

Invoice Generator is a product of Maple-Tyne Technologies Inc.

## Pages

- `/` Invoice generator
- `/faq/` FAQ
- `/privacy/` Privacy policy
- `/cookies/` Cookies policy
- `/terms/` Terms of use
- `/legal/` Legal
- `/admin/` Admin dashboard (protected with Basic Auth)

## Local dev

```bash
npm install
npm run dev
```

Note: In some sandboxed environments, binding a dev server port may be blocked. `npm run build` still validates the app.

## Build

```bash
npm run build
```

Outputs `dist/`.

## Analytics (Hostinger: PHP + MySQL)

Tracking is opt-in (cookie banner). When enabled, the frontend posts events to `/api/track.php`:

- `page_view`
- `invoice_pdf_download`

### MySQL schema

Create the `events` table:

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

### Configure credentials

Edit `public/api/_config.php` before deploying:

- `DB.host`, `DB.name`, `DB.user`, `DB.pass`
- `IP_HASH_SALT` (set to a random string)
- `SITE_HOST` (single canonical host) or `SITE_HOSTS` (allowlist for multiple hosts, e.g. `example.com` + `www.example.com`)

## Admin protection (Basic Auth)

This build copies Basic Auth `.htaccess` templates into:

- `dist/admin/.htaccess`
- `dist/admin-api/.htaccess`

Templates live in:

- `hostinger/admin.htaccess`
- `hostinger/admin-api.htaccess`

Update `AuthUserFile` in both templates to the correct absolute path where you place your `.htpasswd` on Hostinger.

Recommended username: `admin@invoicegenerator.cloud`

Example `.htpasswd` creation (run locally, then upload to the server path you referenced in `AuthUserFile`):

```bash
htpasswd -c .htpasswd admin@invoicegenerator.cloud
```

## Data retention (90 days)

`/admin-api/cleanup.php?run=1` deletes analytics events older than 90 days (endpoint is Basic Auth protected).
Set a Hostinger cron to call it daily.

## PDF quality check (optional)

Generate a stable sample PDF:

```bash
npm run pdf:sample
```

Then render to images for visual inspection (if `pdftoppm` is installed):

```bash
pdftoppm -png tmp/pdfs/invoice-sample.pdf tmp/pdfs/invoice-sample
```

## Deploy (Hostinger)

See `DEPLOY_HOSTINGER.md`.
