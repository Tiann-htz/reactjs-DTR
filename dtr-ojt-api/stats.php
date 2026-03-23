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
if (empty($student_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id is required.']);
    exit();
}

$stmtRec = $pdo->prepare("
    SELECT TotalHours, Status
    FROM studentrec
    WHERE StudentID = ?
    LIMIT 1
");
$stmtRec->execute([$student_id]);
$rec = $stmtRec->fetch(PDO::FETCH_ASSOC);

if (!$rec) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student record not found.']);
    exit();
}

$totalHours = (int)($rec['TotalHours'] ?? 0);
$status     = $rec['Status'] ?? 'Active';

// Sum actual rendered hours from dtr_tbl
$stmtHours = $pdo->prepare("
    SELECT SUM(TIME_TO_SEC(T_Hours)) AS total_seconds
    FROM dtr_tbl
    WHERE Student_ID = ?
      AND T_Hours IS NOT NULL
      AND Status != 'Absent'
");
$stmtHours->execute([$student_id]);
$row = $stmtHours->fetch(PDO::FETCH_ASSOC);

$totalSeconds = (int)($row['total_seconds'] ?? 0);

$rH = (int)floor($totalSeconds / 3600);
$rM = (int)floor(($totalSeconds % 3600) / 60);
$rS = (int)($totalSeconds % 60);

$renderedDec  = $totalSeconds / 3600;
$remainingDec = max(0, $totalHours - $renderedDec);
$remH         = (int)floor($remainingDec);
$remM         = (int)round(($remainingDec - $remH) * 60);
$pct          = $totalHours > 0 ? min(100, round(($renderedDec / $totalHours) * 100, 1)) : 0;

echo json_encode([
    'success' => true,
    'student' => [
        'total_hours'      => $totalHours,
        'rendered_h'       => $rH,
        'rendered_m'       => $rM,
        'rendered_s'       => $rS,
        'rendered_decimal' => round($renderedDec, 4),
        'remaining_h'      => $remH,
        'remaining_m'      => $remM,
        'percent'          => $pct,
        'status'           => $status,
    ]
]);