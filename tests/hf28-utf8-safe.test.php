<?php
declare(strict_types=1);
define('NUTRITION_GEMINI_INTERNAL', true);
require __DIR__.'/../api/utf8-safe.php';

$checks = 0;
$assert = static function (bool $condition, string $message) use (&$checks): void {
    $checks++;
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
};

$assert(nutrition_utf8_truncate('творог', 4) === 'твор', 'Russian truncation must preserve characters');
$assert(nutrition_utf8_truncate('🥗🍎🥛', 2) === '🥗🍎', 'Emoji truncation must preserve code points');
$assert(nutrition_utf8_length('ёжик') === 4, 'UTF-8 length must count characters');
$broken = "Рацион: творо\xD0г и яблоко";
$clean = nutrition_utf8_sanitize($broken);
$assert(preg_match('//u', $clean) === 1, 'Malformed UTF-8 must be removed');
$assert(str_contains($clean, 'Рацион:'), 'Valid text around malformed bytes must survive');
$json = json_encode(['text' => $broken], nutrition_json_flags());
$assert(is_string($json) && json_last_error() === JSON_ERROR_NONE, 'JSON must remain encodable with substitution');
$long = str_repeat('я', 900);
$cut = nutrition_utf8_truncate($long, 800);
$assert(nutrition_utf8_length($cut) === 800, '800-character media context must remain valid');
$assert(preg_match('//u', $cut) === 1, 'Truncated media context must be valid UTF-8');

echo json_encode(['ok'=>true,'assertions'=>$checks], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n";
