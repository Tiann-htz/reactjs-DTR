<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

require_once 'db.php';

$data       = json_decode(file_get_contents("php://input"), true);
$dtr_id     = (int)($data['dtr_id']    ?? 0);
$student_id = trim($data['student_id'] ?? '');

if (!$dtr_id || empty($student_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'dtr_id and student_id are required.']);
    exit();
}

$stmt = $pdo->prepare("DELETE FROM dtr_tbl WHERE dtr_id = ? AND Student_ID = ?");
$stmt->execute([$dtr_id, $student_id]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Record not found or not yours.']);
    exit();
}

echo json_encode(['success' => true, 'message' => 'DTR entry deleted.']);