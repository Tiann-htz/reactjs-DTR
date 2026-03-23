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
$password   = $data['password'] ?? '';

if (empty($student_id) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Student ID and password are required.']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT us.student_id, us.username, us.fullname, us.role, us.password,
           sr.Name, sr.School, sr.Coordinator,
           sr.ContactNoStudent,
           sr.EmailStudent,
           sr.TotalHours,
           sr.Status,
           sr.ContactNoCoordinator, sr.EmailCoordinator
    FROM users_student us
    LEFT JOIN studentrec sr ON sr.StudentID = us.student_id
    WHERE us.student_id = ?
    LIMIT 1
");
$stmt->execute([$student_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Student ID not found.']);
    exit();
}

$valid = password_verify($password, $user['password']) || $password === $user['password'];
if (!$valid) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect password.']);
    exit();
}

// Sum actual rendered hours from dtr_tbl
$stmtHours = $pdo->prepare("
    SELECT SUM(TIME_TO_SEC(T_Hours)) AS total_seconds
    FROM dtr_tbl
    WHERE Student_ID = ?
      AND T_Hours IS NOT NULL
      AND Status != 'Absent'
");
$stmtHours->execute([$student_id]);
$hoursRow = $stmtHours->fetch(PDO::FETCH_ASSOC);

$totalSeconds = (int)($hoursRow['total_seconds'] ?? 0);
$totalHours   = (int)($user['TotalHours'] ?? 0);

$rH = (int)floor($totalSeconds / 3600);
$rM = (int)floor(($totalSeconds % 3600) / 60);
$rS = (int)($totalSeconds % 60);

$renderedDec  = $totalSeconds / 3600;
$remainingDec = max(0, $totalHours - $renderedDec);
$remH         = (int)floor($remainingDec);
$remM         = (int)round(($remainingDec - $remH) * 60);
$pct          = $totalHours > 0 ? min(100, round(($renderedDec / $totalHours) * 100, 1)) : 0;

// Fetch photo and embed as base64 — works on PC and phone without proxy issues
$photo_b64 = null;
$stmtPhoto = $pdo->prepare("SELECT IDPicture FROM studentrec WHERE StudentID = ? LIMIT 1");
$stmtPhoto->execute([$student_id]);
$photoRow = $stmtPhoto->fetch(PDO::FETCH_ASSOC);
if ($photoRow && !empty($photoRow['IDPicture'])) {
    $finfo     = new finfo(FILEINFO_MIME_TYPE);
    $mime      = $finfo->buffer($photoRow['IDPicture']);
    if (!$mime || !str_starts_with($mime, 'image/')) $mime = 'image/jpeg';
    $photo_b64 = 'data:' . $mime . ';base64,' . base64_encode($photoRow['IDPicture']);
}

echo json_encode([
    'success' => true,
    'student' => [
        'student_id'          => $user['student_id'],
        'username'            => $user['username'],
        'fullname'            => $user['fullname'],
        'name'                => $user['Name'] ?? $user['fullname'],
        'role'                => $user['role'],
        'school'              => $user['School'] ?? '',
        'coordinator'         => $user['Coordinator'] ?? '',
        'contact'             => $user['ContactNoStudent'] ?? '',
        'email'               => $user['EmailStudent'] ?? '',
        'coordinator_contact' => $user['ContactNoCoordinator'] ?? '',
        'coordinator_email'   => $user['EmailCoordinator'] ?? '',
        'status'              => $user['Status'] ?? 'Active',
        'total_hours'         => $totalHours,
        'rendered_h'          => $rH,
        'rendered_m'          => $rM,
        'rendered_s'          => $rS,
        'rendered_decimal'    => round($renderedDec, 4),
        'remaining_h'         => $remH,
        'remaining_m'         => $remM,
        'percent'             => $pct,
        'photo_url'           => $photo_b64,
    ]
]);