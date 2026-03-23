<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

require_once 'db.php';

$student_id = trim($_GET['student_id'] ?? '');
$format     = trim($_GET['format']     ?? 'image');

if (empty($student_id)) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode(['success' => false, 'message' => 'student_id is required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT IDPicture FROM studentrec WHERE StudentID = ? LIMIT 1");
$stmt->execute([$student_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['IDPicture'])) {
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode(['success' => false, 'message' => 'No photo found.']);
    exit();
}

$imageData = $row['IDPicture'];

// Detect image type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->buffer($imageData);
if (!$mime || !str_starts_with($mime, 'image/')) {
    $mime = 'image/jpeg';
}

// Return as base64 JSON — works on any device without proxy issues
if ($format === 'base64') {
    header("Content-Type: application/json");
    echo json_encode([
        'success'   => true,
        'photo_b64' => 'data:' . $mime . ';base64,' . base64_encode($imageData),
    ]);
    exit();
}

// Default — stream image directly
header("Content-Type: $mime");
header("Content-Length: " . strlen($imageData));
header("Cache-Control: public, max-age=86400");
echo $imageData;
exit();