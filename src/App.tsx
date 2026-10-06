import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherHistoryPage from './pages/TeacherHistoryPage';
import TeacherSessionDetailsPage from './pages/TeacherSessionDetailsPage';
import TeacherLivePage from './pages/TeacherLivePage';
import StudentJoinPage from './pages/StudentJoinPage';
import StudentHistoryPage from './pages/StudentHistoryPage';
import StudentLivePage from './pages/StudentLivePage';
import { RootRedirect } from './pages/PlaceholderPages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta raíz: redirige según autenticación y rol */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas Públicas */}
          <Route path="/login" element={<AuthPage />} />

          {/* Rutas Protegidas del Docente */}
          <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/teacher/history" element={<TeacherHistoryPage />} />
            <Route path="/teacher/history/:code" element={<TeacherSessionDetailsPage />} />
            {/* Paso 4 y 5: Sala en vivo */}
            <Route path="/teacher/session/:code" element={<TeacherLivePage />} />
          </Route>

          {/* Rutas Protegidas del Estudiante */}
          <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route path="/student/join" element={<StudentJoinPage />} />
            <Route path="/student/history" element={<StudentHistoryPage />} />
            {/* Paso 6: Sala de subtítulos en vivo */}
            <Route path="/student/session/:code" element={<StudentLivePage />} />
          </Route>

          {/* Fallback: cualquier ruta no encontrada redirige a la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
