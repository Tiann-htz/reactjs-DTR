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
    SELECT
        dtr_id,
        Student_ID,
        DateReport,
        TimeIn,
        TimeOut,
        T_Hours,
        Status,
        Note,
        ToDo,
        DSR
    FROM dtr_tbl
    WHERE Student_ID = ?
    ORDER BY DateReport DESC
    LIMIT ? OFFSET ?
");
$stmt->execute([$student_id, $limit, $offset]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

function fmtTime($val) {
    if (!$val) return '00:00';
    if ($val instanceof \DateInterval) {
        return sprintf('%02d:%02d', $val->h + ($val->days * 24), $val->i);
    }
    $parts = explode(':', (string)$val);
    $h = (int)($parts[0] ?? 0);
    $m = (int)($parts[1] ?? 0);
    return sprintf('%02d:%02d', $h, $m);
}

$records = array_map(function($r) {
    return [
        'dtr_id'     => $r['dtr_id'],
        'Student_ID' => $r['Student_ID'],
        'DateReport' => $r['DateReport'],
        'TimeIn'     => fmtTime($r['TimeIn']),
        'TimeOut'    => fmtTime($r['TimeOut']),
        'T_Hours'    => fmtTime($r['T_Hours']),
        'Status'     => $r['Status'],
        'Note'       => $r['Note'],
        'Todo_text'  => fmtTime($r['ToDo']),
        'Dsr_text'   => fmtTime($r['DSR']),
    ];
}, $rows);

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM dtr_tbl WHERE Student_ID = ?");
$countStmt->execute([$student_id]);
$total = (int)$countStmt->fetchColumn();

echo json_encode([
    'success' => true,
    'total'   => $total,
    'limit'   => $limit,
    'offset'  => $offset,
    'records' => $records,
]);