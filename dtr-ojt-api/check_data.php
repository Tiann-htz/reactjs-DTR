<?php
require_once 'db.php';
$stmt = $pdo->prepare("
    SELECT TotalHours, T_TotalHours 
    FROM studentrec 
    WHERE StudentID = '59828781'
");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($row);