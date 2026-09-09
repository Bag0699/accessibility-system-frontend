import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import { StudentJoinPage, RootRedirect } from './pages/PlaceholderPages';

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
            {/* Paso 4: Sala en vivo se agregará aquí */}
            {/* <Route path="/teacher/session/:code" element={<TeacherLivePage />} /> */}
            {/* Paso 8: Historial se agregará aquí */}
            {/* <Route path="/teacher/history" element={<HistoryPage />} /> */}
          </Route>

          {/* Rutas Protegidas del Estudiante */}
          <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route path="/student/join" element={<StudentJoinPage />} />
            {/* Paso 6: Sala de subtítulos en vivo se agregará aquí */}
            {/* <Route path="/student/session/:code" element={<StudentLivePage />} /> */}
          </Route>

          {/* Fallback: cualquier ruta no encontrada redirige a la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
