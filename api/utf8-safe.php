<?php
declare(strict_types=1);

if (!defined('NUTRITION_GEMINI_INTERNAL')) {
    http_response_code(404);
    exit;
}

/**
 * Remove malformed UTF-8 byte sequences without requiring mbstring or iconv.
 * Valid scalar values are preserved byte-for-byte; overlong sequences,
 * surrogates and code points above U+10FFFF are discarded.
 */
function nutrition_utf8_sanitize(string $value): string {
    if ($value === '' || preg_match('//u', $value) === 1) return $value;
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
        if (is_string($converted) && preg_match('//u', $converted) === 1) return $converted;
    }
    $out = '';
    $length = strlen($value);
    for ($i = 0; $i < $length;) {
        $b1 = ord($value[$i]);
        if ($b1 <= 0x7F) {
            $out .= $value[$i++];
            continue;
        }
        $needed = 0;
        $minSecond = 0x80;
        $maxSecond = 0xBF;
        if ($b1 >= 0xC2 && $b1 <= 0xDF) {
            $needed = 1;
        } elseif ($b1 === 0xE0) {
            $needed = 2; $minSecond = 0xA0;
        } elseif ($b1 >= 0xE1 && $b1 <= 0xEC) {
            $needed = 2;
        } elseif ($b1 === 0xED) {
            $needed = 2; $maxSecond = 0x9F;
        } elseif ($b1 >= 0xEE && $b1 <= 0xEF) {
            $needed = 2;
        } elseif ($b1 === 0xF0) {
            $needed = 3; $minSecond = 0x90;
        } elseif ($b1 >= 0xF1 && $b1 <= 0xF3) {
            $needed = 3;
        } elseif ($b1 === 0xF4) {
            $needed = 3; $maxSecond = 0x8F;
        } else {
            $i++;
            continue;
        }
        if ($i + $needed >= $length) break;
        $b2 = ord($value[$i + 1]);
        if ($b2 < $minSecond || $b2 > $maxSecond) {
            $i++;
            continue;
        }
        $valid = true;
        for ($j = 2; $j <= $needed; $j++) {
            $bx = ord($value[$i + $j]);
            if ($bx < 0x80 || $bx > 0xBF) { $valid = false; break; }
        }
        if (!$valid) {
            $i++;
            continue;
        }
        $out .= substr($value, $i, $needed + 1);
        $i += $needed + 1;
    }
    return $out;
}

function nutrition_utf8_length(string $value): int {
    $value = nutrition_utf8_sanitize($value);
    if ($value === '') return 0;
    if (function_exists('mb_strlen')) return (int)mb_strlen($value, 'UTF-8');
    $count = preg_match_all('/./us', $value, $matches);
    return $count === false ? strlen($value) : $count;
}

function nutrition_utf8_truncate(string $value, int $maxChars): string {
    $value = nutrition_utf8_sanitize($value);
    $maxChars = max(0, $maxChars);
    if ($maxChars === 0 || $value === '') return '';
    if (function_exists('mb_substr')) return (string)mb_substr($value, 0, $maxChars, 'UTF-8');
    $matched = preg_match_all('/./us', $value, $matches);
    if ($matched === false || $matched <= $maxChars) return $value;
    return implode('', array_slice($matches[0], 0, $maxChars));
}

function nutrition_json_flags(bool $pretty = false): int {
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE;
    if ($pretty) $flags |= JSON_PRETTY_PRINT;
    return $flags;
}
