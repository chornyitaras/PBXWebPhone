<?php
declare(strict_types=1);

$indexHtml = __DIR__ . '/index.html';

if (!is_file($indexHtml)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'index.html is missing.';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
readfile($indexHtml);
