import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Shield, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

type AuthMode = "login" | "register";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, registerStudent, registerTeacher } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<Role>("TEACHER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login({ email: formData.email, password: formData.password });
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };
        if (selectedRole === "TEACHER") {
          await registerTeacher(payload);
        } else {
          await registerStudent(payload);
        }
      }
      // Redirigir según el rol que devuelve el AuthContext después del login/registro
      const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (storedUser?.role === "TEACHER") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/join");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Ocurrió un error. Verifica tus datos e intenta nuevamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isTeacher = selectedRole === "TEACHER";

  return (
    <div className="min-h-screen flex">
      {/* Panel Izquierdo Promocional */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">ClaseAccesible</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Educación sin barreras, aprendizaje para todos.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Plataforma inclusiva diseñada para romper barreras de comunicación
            en el aula mediante transcripción y subtítulos en tiempo real.
          </p>

          <div className="bg-gray-800 rounded-xl h-44 flex items-center justify-center mb-8">
            <p className="text-gray-500 text-sm italic">
              Captura de pantalla de sesión activa
            </p>
          </div>

          <div className="flex gap-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">TRANSCRIPCIÓN EN VIVO</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Subtítulos instantáneos para máxima comprensión.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">ENTORNO SEGURO</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Sesiones privadas protegidas por código de acceso.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-xs">
          © 2026 ClaseAccesible. Diseñado para la inclusión educativa.
        </p>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">
              ClaseAccesible
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === "login" ? "Bienvenido de nuevo" : "Crear una cuenta"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {mode === "login"
              ? "Ingresa a tu cuenta para continuar con tus clases."
              : "Regístrate para comenzar a usar la plataforma."}
          </p>

          {/* Toggle de Rol */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole("TEACHER")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                isTeacher
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Docente
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("STUDENT")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                !isTeacher
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Estudiante
            </button>
          </div>

          {/* Descripción según rol */}
          <p className="text-xs text-gray-500 mb-5 -mt-2">
            {isTeacher
              ? "Gestiona tus sesiones y materiales de clase."
              : "Únete a clases con el código proporcionado por tu docente."}
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. María García"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="elena.martinez@universidad.edu"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contraseña
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Iniciar Sesión →"
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          {/* Cambio de modo login/registro */}
          <div className="mt-6 text-center">
            {mode === "login" ? (
              <>
                <p className="text-sm text-gray-500">¿NO TIENES UNA CUENTA?</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="mt-2 w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition text-sm"
                >
                  Crear una cuenta nueva
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400 space-x-3">
            <a href="#" className="hover:text-gray-600">
              Ayuda
            </a>
            <a href="#" className="hover:text-gray-600">
              Privacidad
            </a>
            <a href="#" className="hover:text-gray-600">
              Accesibilidad
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
