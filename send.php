<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success, string $message): never
{
    http_response_code($status);
    echo json_encode([
        'success' => $success,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Форма принимает только отправленные заявки.');
}

// Honeypot: a filled hidden field usually indicates an automated submission.
if (!empty($_POST['website'] ?? '')) {
    respond(200, true, 'Спасибо! Заявка принята.');
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$comment = trim((string)($_POST['comment'] ?? ''));
$consent = (string)($_POST['consent'] ?? '');

$clip = static function (string $value, int $limit): string {
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit, 'UTF-8') : substr($value, 0, $limit);
};
$name = $clip(strip_tags($name), 100);
$phone = $clip(strip_tags($phone), 30);
$comment = $clip(strip_tags($comment), 1500);

if ($name === '' || $phone === '' || $consent !== '1') {
    respond(422, false, 'Заполните имя и телефон и подтвердите согласие на обработку данных.');
}

$digits = preg_replace('/\D+/', '', $phone) ?? '';
if (strlen($digits) < 7) {
    respond(422, false, 'Проверьте номер телефона — в нём слишком мало цифр.');
}

$storageDir = __DIR__ . DIRECTORY_SEPARATOR . 'storage';
if (!is_dir($storageDir) && !mkdir($storageDir, 0750, true) && !is_dir($storageDir)) {
    respond(500, false, 'Не удалось сохранить заявку. Напишите нам по телефону или почте.');
}

$csvPath = $storageDir . DIRECTORY_SEPARATOR . 'leads.csv';
$handle = @fopen($csvPath, 'ab');
if ($handle === false) {
    respond(500, false, 'Не удалось сохранить заявку. Напишите нам по телефону или почте.');
}

if (!flock($handle, LOCK_EX)) {
    fclose($handle);
    respond(500, false, 'Не удалось сохранить заявку. Попробуйте ещё раз.');
}

$writeOk = fputcsv($handle, [date('Y-m-d H:i:s'), $name, $phone, $comment], ';') !== false;
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

if (!$writeOk) {
    respond(500, false, 'Не удалось сохранить заявку. Попробуйте ещё раз.');
}

// Email notifications are attempted when PHP mail() is configured on the server.
$sent = false;
if (function_exists('mail')) {
    $subject = '=?UTF-8?B?' . base64_encode('Новая заявка с сайта КОМБУЧАЧА') . '?=';
    $body = "Новая заявка с сайта КОМБУЧАЧА\n\n"
        . "Имя: {$name}\n"
        . "Телефон: {$phone}\n"
        . "Комментарий: " . ($comment !== '' ? $comment : 'не указан') . "\n";
    $headers = "From: site@kombuchacha.ru\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    $sent = @mail('order@kombuchacha.ru', $subject, $body, $headers);
}

if ($sent) {
    respond(200, true, 'Спасибо! Заявка отправлена. Скоро свяжемся с вами.');
}

respond(200, true, 'Спасибо! Заявка сохранена. Мы свяжемся с вами.');
