import { useEffect, useState } from 'react';
import { Check, Eye, Loader2 } from 'lucide-react';
import StudentLayout from '../components/student/StudentLayout';
import { userService } from '../services/userService';
import type { UserPreferences } from '../types';

const defaultPreferences: UserPreferences = {
  fontSize: 'medium',
  highContrast: false,
  theme: 'light',
  language: 'es-ES',
};

const previewCopy: Record<string, string> = {
  'es-ES': 'Hola, esta es una vista previa de los subtítulos de clase.',
  'en-US': 'Hello, this is a preview of the class subtitles.',
};

const StudentSettingsPage = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await userService.getPreferences();
        setPreferences(savedPreferences);
      } catch {
        setLoadError('No se pudieron cargar tus preferencias guardadas. Puedes editarlas y volver a guardar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const updatedPreferences = await userService.updatePreferences(preferences);
      setPreferences(updatedPreferences);
      setSaved(true);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setSaveError(message ?? 'No se pudieron guardar tus preferencias. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewTheme = preferences.highContrast
    ? 'bg-black text-yellow-300 border-yellow-400'
    : preferences.theme === 'dark'
      ? 'bg-gray-900 text-white border-gray-700'
      : 'bg-white text-gray-900 border-gray-200';
  const previewFontSize = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-3xl',
  }[preferences.fontSize];

  return (
    <StudentLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Ajustes de accesibilidad</h1>
          <p className="text-gray-500 mt-1">Personaliza la lectura de los subtítulos en tus clases.</p>
        </header>

        {loadError && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Cargando tus preferencias...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-6">
              <div>
                <label htmlFor="font-size" className="block text-sm font-semibold text-gray-800 mb-2">
                  Tamaño de fuente
                </label>
                <select
                  id="font-size"
                  value={preferences.fontSize}
                  onChange={(event) => update('fontSize', event.target.value as UserPreferences['fontSize'])}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Pequeño</option>
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <fieldset>
                <legend className="block text-sm font-semibold text-gray-800 mb-2">Tema</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(['light', 'dark'] as const).map((theme) => (
                    <label
                      key={theme}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm cursor-pointer ${
                        preferences.theme === theme ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={preferences.theme === theme}
                        onChange={() => update('theme', theme)}
                        className="accent-blue-600"
                      />
                      {theme === 'light' ? 'Claro' : 'Oscuro'}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(event) => update('highContrast', event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Alto contraste</span>
                  <span className="block text-xs text-gray-500 mt-1">Usa texto amarillo sobre fondo negro para facilitar la lectura.</span>
                </span>
              </label>

              <div>
                <label htmlFor="language" className="block text-sm font-semibold text-gray-800 mb-2">
                  Idioma preferido
                </label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(event) => update('language', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="es-ES">Español</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              {saveError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{saveError}</p>}
              {saved && <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">Preferencias guardadas.</p>}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Vista previa en vivo</h2>
              </div>
              <div
                lang={preferences.language}
                aria-live="polite"
                className={`min-h-48 rounded-xl border-2 p-6 flex items-center justify-center text-center transition-all ${previewTheme}`}
              >
                <p className={`${previewFontSize} font-semibold leading-relaxed`}>
                  {previewCopy[preferences.language] ?? previewCopy['es-ES']}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                La vista previa cambia al modificar las opciones y refleja el estilo de los subtítulos.
              </p>
            </section>
          </form>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentSettingsPage;
