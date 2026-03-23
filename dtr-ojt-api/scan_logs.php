<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

require_once 'db.php';

$student_id = trim($_GET['student_id'] ?? '');
$limit      = min(max((int)($_GET['limit']  ?? 20), 1), 100);
$offset     = max((int)($_GET['offset'] ?? 0), 0);

if (empty($student_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id is required.']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT ID, StudentID,
           DATE(ScanTime)                        AS ScanDate,
           TIME_FORMAT(TIME(ScanTime), '%H:%i:%s') AS ScanTime,
           ScanType, DeviceName
    FROM scan_logs
    WHERE StudentID = ?
    ORDER BY ScanTime DESC
    LIMIT ? OFFSET ?
");
$stmt->execute([$student_id, $limit, $offset]);
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM scan_logs WHERE StudentID = ?");
$countStmt->execute([$student_id]);
$total = (int)$countStmt->fetchColumn();

echo json_encode([
    'success' => true,
    'total'   => $total,
    'limit'   => $limit,
    'offset'  => $offset,
    'logs'    => $logs,
]);