const BASE_URL = '/dtr-ojt-api';

export async function loginStudent(studentId, password) {
  const res = await fetch(`${BASE_URL}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Login failed.');
  return data;
}

export async function fetchScanLogs(studentId, limit = 20, offset = 0) {
  const params = new URLSearchParams({ student_id: studentId, limit, offset });
  const res = await fetch(`${BASE_URL}/scan_logs.php?${params}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch scan logs.');
  return data;
}

export async function fetchStudentStats(studentId) {
  const params = new URLSearchParams({ student_id: studentId });
  const res = await fetch(`${BASE_URL}/stats.php?${params}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch stats.');
  return data;
}

export async function fetchDtrRecords(studentId, limit = 20, offset = 0) {
  const params = new URLSearchParams({ student_id: studentId, limit, offset });
  const res = await fetch(`${BASE_URL}/dtr_records.php?${params}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch DTR records.');
  return data;
}

export async function postDtrEntry(payload) {
  const res = await fetch(`${BASE_URL}/dtr_post.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to post DTR entry.');
  return data;
}

export async function updateDtrEntry(payload) {
  const res = await fetch(`${BASE_URL}/dtr_update.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update DTR entry.');
  return data;
}

export async function deleteDtrEntry(dtrId, studentId) {
  const res = await fetch(`${BASE_URL}/dtr_delete.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dtr_id: dtrId, student_id: studentId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete DTR entry.');
  return data;
}