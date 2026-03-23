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
$student_id = trim($data['student_id'] ?? '');
$date       = trim($data['date']       ?? '');
$time_in    = trim($data['time_in']    ?? '');
$time_out   = trim($data['time_out']   ?? '');
$status     = trim($data['status']     ?? 'Regular');
$note       = trim($data['note']       ?? '');
$todo       = trim($data['todo']       ?? '08:00');
$dsr        = trim($data['dsr']        ?? '17:00');

if (empty($student_id) || empty($date) || empty($time_in) || empty($time_out)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id, date, time_in, time_out are required.']);
    exit();
}

// Check duplicate date
$chk = $pdo->prepare("SELECT dtr_id FROM dtr_tbl WHERE Student_ID = ? AND DateReport = ?");
$chk->execute([$student_id, $date]);
if ($chk->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'A record for this date already exists.']);
    exit();
}

// Parse H and M from HH:MM strings
$inParts   = explode(':', $time_in);
$outParts  = explode(':', $time_out);
$todoParts = explode(':', $todo);
$dsrParts  = explode(':', $dsr);

$inH  = (int)($inParts[0]  ?? 0);
$inM  = (int)($inParts[1]  ?? 0);
$outH = (int)($outParts[0] ?? 0);
$outM = (int)($outParts[1] ?? 0);

$todoH = (int)($todoParts[0] ?? 8);
$todoM = (int)($todoParts[1] ?? 0);
$dsrH  = (int)($dsrParts[0]  ?? 17);
$dsrM  = (int)($dsrParts[1]  ?? 0);

$inTotalMin  = $inH  * 60 + $inM;
$outTotalMin = $outH * 60 + $outM;

// Lunch break deduction 12:00–13:00
$lunchStart  = 12 * 60;
$lunchEnd    = 13 * 60;
$lunchDeduct = 0;

if ($inTotalMin < $lunchEnd && $outTotalMin > $lunchStart) {
    $overlapStart = max($inTotalMin, $lunchStart);
    $overlapEnd   = min($outTotalMin, $lunchEnd);
    $lunchDeduct  = max(0, $overlapEnd - $overlapStart);
}

$totalMin = max(0, $outTotalMin - $inTotalMin - $lunchDeduct);
$hours    = round($totalMin / 60, 2);

$stdInMin  = 8  * 60;
$stdOutMin = 17 * 60;

$lateMin  = max(0, $inTotalMin - $stdInMin);
$late     = round($lateMin / 60, 2);

$underMin  = max(0, $stdOutMin - $outTotalMin);
$undertime = round($underMin / 60, 2);

$stmt = $pdo->prepare("
    INSERT INTO dtr_tbl
        (Student_ID, DateReport,
         TimeIn,             TimeOut,
         Hours, T_Hours,
         Late,  T_Late,
         UnderTime, T_UnderTime,
         Status, Note,
         ToDo,               DSR)
    VALUES
        (?, ?,
         MAKETIME(?, ?, 0),  MAKETIME(?, ?, 0),
         ?, MAKETIME(?, ?, 0),
         ?, MAKETIME(?, ?, 0),
         ?, MAKETIME(?, ?, 0),
         ?, ?,
         MAKETIME(?, ?, 0),  MAKETIME(?, ?, 0))
");

$stmt->execute([
    $student_id, $date,
    $inH,  $inM,
    $outH, $outM,
    $hours,
    intdiv($totalMin, 60), $totalMin % 60,
    $late,
    intdiv($lateMin, 60), $lateMin % 60,
    $undertime,
    intdiv($underMin, 60), $underMin % 60,
    $status, $note,
    $todoH, $todoM,
    $dsrH,  $dsrM,
]);

echo json_encode([
    'success' => true,
    'message' => 'DTR entry posted successfully.',
    'dtr_id'  => $pdo->lastInsertId(),
]);