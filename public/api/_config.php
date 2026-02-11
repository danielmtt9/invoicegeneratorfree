<?php
// Shared config for public and admin endpoints.
// NOTE: This file is executed as PHP, not served as plain text. It should not output anything.
// Replace placeholders before deployment.

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
  http_response_code(404);
  exit;
}

return [
  // Origin/referrer allowlist for analytics. Prefer setting a single canonical host and redirecting
  // the other one to it, but allowing both avoids accidental 403s when DNS/redirects aren’t settled.
  //
  // Use either:
  // - SITE_HOST (string) for one host, or
  // - SITE_HOSTS (array of strings) for multiple hosts (e.g. example.com + www.example.com).
  //
  // NOTE: hosts only (no scheme), lower-case.
  'SITE_HOST' => 'invoicegenerator.cloud',
  // 'SITE_HOSTS' => ['invoicegenerator.cloud', 'www.invoicegenerator.cloud'],

  // Rotate this salt to change how IPs are hashed. Do not reuse production secrets elsewhere.
  'IP_HASH_SALT' => 'CHANGE_ME_TO_A_RANDOM_STRING',

  'DB' => [
    'host' => 'localhost',
    'name' => 'u746391188_invoice',
    'user' => 'u746391188_invoice',
    'pass' => 'CHANGE_ME_DB_PASSWORD',
    'charset' => 'utf8mb4',
  ],

  // Simple abuse controls
  'RATE_LIMIT_MAX_PER_MIN' => 120,
  'UA_MAX_LEN' => 255,
  'PATH_MAX_LEN' => 255,
  'REF_MAX_LEN' => 255,
  'VID_MAX_LEN' => 64,
  'META_MAX_LEN' => 2000,
];
