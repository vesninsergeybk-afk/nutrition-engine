<?php
/**
 * Example only. Copy this file to a location outside the public web root,
 * set permissions to owner-read only, and point GEMINI_SECRET_FILE to it.
 * Never commit or package the populated file.
 */
if (!defined('NUTRITION_GEMINI_INTERNAL')) {
    http_response_code(404);
    exit;
}
return [
    'primary' => 'REPLACE_WITH_PRIMARY_GEMINI_KEY',
    'backup' => ['REPLACE_WITH_BACKUP_GEMINI_KEY'],
];
