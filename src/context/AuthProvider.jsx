import { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { loginStudent, fetchStudentStats } from '../api';

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(() => {
    try {
      const stored = sessionStorage.getItem('dtr_student');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const login = useCallback(async (studentId, password) => {
    setLoading(true);
    setError('');
    try {
      const data = await loginStudent(studentId, password);
      setStudent(data.student);
      sessionStorage.setItem('dtr_student', JSON.stringify(data.student));
      return true;
    } catch (err) {
      setError(err.message || 'Could not connect to the server.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    sessionStorage.removeItem('dtr_student');
  }, []);

  const refreshStats = useCallback(async (studentId) => {
    try {
      const data = await fetchStudentStats(studentId);
      setStudent(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          total_hours:      data.student.total_hours,
          rendered_h:       data.student.rendered_h,
          rendered_m:       data.student.rendered_m,
          rendered_s:       data.student.rendered_s,
          rendered_decimal: data.student.rendered_decimal,
          remaining_h:      data.student.remaining_h,
          remaining_m:      data.student.remaining_m,
          percent:          data.student.percent,
          status:           data.student.status,
        };
        sessionStorage.setItem('dtr_student', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silently fail — login data still shown
    }
  }, []);

  return (
    <AuthContext.Provider value={{ student, login, logout, loading, error, refreshStats }}>
      {children}
    </AuthContext.Provider>
  );
}