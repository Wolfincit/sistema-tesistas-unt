import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { driveApiService, DriveFolderItem } from '../../services/driveApiService';
import {
  HardDrive,
  FolderOpen,
  FolderPlus,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Unlink,
  Search,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Database,
  FileText,
  Mic,
  Settings,
  Copy,
  AlertCircle,
  X,
  Link2
} from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveManager: React.FC = () => {
  const { driveStatus, refrescarDriveStatus, refrescarTodo, agregarToast } = useApp();

  const [cargandoAccion, setCargandoAccion] = useState<boolean>(false);
  const [mostrarConfigAdmin, setMostrarConfigAdmin] = useState<boolean>(false);
  const [clientIdInput, setClientIdInput] = useState<string>('');
  const [clientSecretInput, setClientSecretInput] = useState<string>('');

  // Modal Explorador Visual de Carpetas de Google Drive ("Examinar")
  const [modalExaminarAbierto, setModalExaminarAbierto] = useState<boolean>(false);
  const [carpetaActualId, setCarpetaActualId] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'Mi Unidad' }]);
  const [carpetas, setCarpetas] = useState<DriveFolderItem[]>([]);
  const [cargandoCarpetas, setCargandoCarpetas] = useState<boolean>(false);
  const [busquedaCarpeta, setBusquedaCarpeta] = useState<string>('');
  const [creandoCarpeta, setCreandoCarpeta] = useState<boolean>(false);
  const [nuevoNombreCarpeta, setNuevoNombreCarpeta] = useState<string>('Expedientes_Ing_Industrial_UNT');
  const [enlaceCarpetaManual, setEnlaceCarpetaManual] = useState<string>('');

  const cargarCarpetasDrive = useCallback(async (parentId = 'root', query = '') => {
    setCargandoCarpetas(true);
    try {
      const res = await driveApiService.listFolders(parentId, query);
      setCarpetas(res.folders || []);
      setCarpetaActualId(parentId);
    } catch (err: any) {
      agregarToast('error', 'Error explorando Drive', err.message || 'No se pudieron listar las carpetas.');
    } finally {
      setCargandoCarpetas(false);
    }
  }, [agregarToast]);

  // Escuchar confirmación del popup de Google OAuth
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'UNT_DRIVE_CONNECTED') {
        agregarToast(
          'success',
          'Google Drive Conectado',
          `Sesión vinculada con ${event.data.email || 'Google Drive'}. Ahora seleccione la carpeta donde se guardarán los expedientes.`
        );
        const st = await refrescarDriveStatus();
        if (st?.connected && !st.rootFolderId) {
          setBreadcrumbs([{ id: 'root', name: 'Mi Unidad' }]);
          setModalExaminarAbierto(true);
          cargarCarpetasDrive('root', '');
        }
      } else if (event.data.type === 'UNT_DRIVE_ERROR') {
        agregarToast('error', 'No se pudo conectar', event.data.error || 'Autorización cancelada.');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [agregarToast, refrescarDriveStatus, cargarCarpetasDrive]);

  const handleConectarGoogle = async () => {
    setCargandoAccion(true);
    try {
      const { authUrl } = await driveApiService.getAuthUrl();
      const w = 520;
      const h = 650;
      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
      const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
      window.open(
        authUrl,
        'UNT_GoogleDrive_OAuth',
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    } catch (err: any) {
      agregarToast('warning', 'Falta paso inicial del administrador', err.message);
      setMostrarConfigAdmin(true);
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleAbrirExaminar = () => {
    setBreadcrumbs([{ id: 'root', name: 'Mi Unidad' }]);
    setBusquedaCarpeta('');
    setModalExaminarAbierto(true);
    cargarCarpetasDrive('root', '');
  };

  const handleEntrarCarpeta = (folder: DriveFolderItem) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setBusquedaCarpeta('');
    cargarCarpetasDrive(folder.id, '');
  };

  const handleIrBreadcrumb = (idx: number) => {
    const nuevoTrail = breadcrumbs.slice(0, idx + 1);
    const destino = nuevoTrail[nuevoTrail.length - 1];
    setBreadcrumbs(nuevoTrail);
    setBusquedaCarpeta('');
    cargarCarpetasDrive(destino.id, '');
  };

  const handleCrearNuevaCarpeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreCarpeta.trim()) return;
    setCargandoAccion(true);
    try {
      const creada = await driveApiService.createFolder(nuevoNombreCarpeta.trim(), carpetaActualId);
      setCreandoCarpeta(false);
      setNuevoNombreCarpeta('Expedientes_Ing_Industrial_UNT');
      agregarToast('success', 'Carpeta Creada', `Se creó "${creada.name}" en su Google Drive.`);
      // Entrar automáticamente a la carpeta recién creada para seleccionarla en 1 clic
      setBreadcrumbs((prev) => [...prev, { id: creada.id, name: creada.name }]);
      await cargarCarpetasDrive(creada.id, '');
    } catch (err: any) {
      agregarToast('error', 'No se pudo crear carpeta', err.message);
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleCrearYActivarAutomatico = async () => {
    setCargandoAccion(true);
    try {
      const creada = await driveApiService.createFolder('Expedientes_Ing_Industrial_UNT', 'root');
      await handleSeleccionarCarpetaDestino(creada.id);
    } catch (err: any) {
      agregarToast('error', 'No se pudo crear la carpeta automática', err.message);
      setCargandoAccion(false);
    }
  };

  const handleSeleccionarCarpetaDestino = async (folderIdOrLink: string) => {
    setCargandoAccion(true);
    try {
      const st = await driveApiService.selectRootFolder(folderIdOrLink);
      await refrescarDriveStatus();
      await refrescarTodo();
      setModalExaminarAbierto(false);
      setEnlaceCarpetaManual('');
      agregarToast(
        'success',
        'Carpeta Configurada y BD Sincronizada',
        `Se creó automáticamente la estructura en "${st.rootFolderName}". Todos los expedientes y audios se guardarán ahí.`
      );
    } catch (err: any) {
      agregarToast('error', 'No se pudo seleccionar la carpeta', err.message);
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleGuardarCredencialesAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoAccion(true);
    try {
      await driveApiService.saveCredentials(clientIdInput, clientSecretInput);
      setClientIdInput('');
      setClientSecretInput('');
      setMostrarConfigAdmin(false);
      await refrescarDriveStatus();
      agregarToast(
        'success',
        'Credenciales Guardadas',
        'Ahora Secretaría ya puede pulsar "Conectar con Google Drive" en 1 clic.'
      );
    } catch (err: any) {
      agregarToast('error', 'Error guardando credenciales', err.message);
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleDesconectar = async () => {
    if (!confirm('¿Desconectar Google Drive de este sistema? Sus carpetas y archivos en Drive NO se borrarán.')) return;
    setCargandoAccion(true);
    try {
      await driveApiService.disconnect();
      await refrescarDriveStatus();
      agregarToast('info', 'Google Drive Desconectado', 'El sistema volvió al almacenamiento temporal local.');
    } catch (err: any) {
      agregarToast('error', 'Error', err.message);
    } finally {
      setCargandoAccion(false);
    }
  };

  const conectadoConCarpeta = driveStatus?.storageMode === 'google-drive';
  const conectadoSinCarpeta = Boolean(driveStatus?.connected && !driveStatus?.rootFolderId);

  return (
    <div className="space-y-5">
      {/* Banner Superior de Estado de Almacenamiento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                conectadoConCarpeta
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-50 text-unt-blue'
              }`}
            >
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Almacenamiento y Base de Datos en Google Drive
                </h2>
                {conectadoConCarpeta ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Conectado y Activo (15 GB)
                  </span>
                ) : conectadoSinCarpeta ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                    Falta elegir carpeta destino
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    Modo Servidor Local (Drive pendiente)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Conecte la cuenta de Google Drive de Secretaría y elija dónde guardar todo. El sistema creará automáticamente
                una carpeta individual con el nombre de cada tesista y guardará los PDFs, audios y base de datos de forma 100% privada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!driveStatus?.connected ? (
              <button
                type="button"
                disabled={cargandoAccion}
                onClick={handleConectarGoogle}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-4 h-4 text-amber-300" />
                <span>{cargandoAccion ? 'Abriendo Google...' : '1. Conectar con Google Drive'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={cargandoAccion}
                  onClick={handleAbrirExaminar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-300" />
                  <span>{driveStatus.rootFolderId ? 'Cambiar carpeta' : '2. Examinar mi Google Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await refrescarDriveStatus();
                    await refrescarTodo();
                    agregarToast('success', 'Sincronizado', 'Datos y espacio de Google Drive actualizados.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar</span>
                </button>

                <button
                  type="button"
                  onClick={handleDesconectar}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                  title="Desconectar esta cuenta de Google Drive"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alerta de error si la sesión de Google expiró */}
        {driveStatus?.errorConexion && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{driveStatus.errorConexion}</span>
            </div>
            <button
              type="button"
              onClick={handleConectarGoogle}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer shrink-0"
            >
              Reconectar
            </button>
          </div>
        )}

        {/* Resumen Visual de Cuenta Conectada + Barra de 15 GB */}
        {driveStatus?.connected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Cuenta y Carpeta Elegida */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  Cuenta de Google Drive Vinculada
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Privado (No público)
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{driveStatus.accountName || 'Cuenta Google'}</p>
                <p className="font-mono text-unt-blue">{driveStatus.accountEmail}</p>
              </div>
              {driveStatus.rootFolderId ? (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">Carpeta principal elegida:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{driveStatus.rootFolderName}</span>
                    </span>
                  </div>
                  <a
                    href={driveStatus.rootFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-unt-blue text-unt-blue font-bold text-[11px] shrink-0"
                  >
                    <span>Abrir en Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={cargandoAccion}
                    onClick={handleCrearYActivarAutomatico}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Crear carpeta automáticamente</span>
                  </button>
                  <button
                    type="button"
                    disabled={cargandoAccion}
                    onClick={handleAbrirExaminar}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Examinar mi Drive</span>
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Espacio Real en Drive (15 GB) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  Espacio Disponible en Google Drive
                </span>
                {driveStatus.quota && (
                  <span className="font-mono font-bold text-slate-800">
                    {driveStatus.quota.usedLabel} / {driveStatus.quota.limitLabel}
                  </span>
                )}
              </div>

              {driveStatus.quota ? (
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        driveStatus.quota.percent > 85
                          ? 'bg-rose-500'
                          : driveStatus.quota.percent > 65
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(2, driveStatus.quota.percent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{driveStatus.quota.percent}% ocupado</span>
                    <span>Al titularse un tesista puede borrar su carpeta para liberar espacio</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Consultando espacio disponible...</p>
              )}
            </div>
          </div>
        )}

        {/* Paso a Paso Amigable para Secretaría (3 pasos claros) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className={`p-3.5 rounded-xl border ${driveStatus?.connected ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${driveStatus?.connected ? 'bg-emerald-600 text-white' : 'bg-[#082F64] text-white'}`}>
                1
              </span>
              <span>Conectar cuenta Google</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Pulse <strong>"Conectar con Google Drive"</strong> e inicie sesión con el correo de Secretaría (15 GB gratis).
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${conectadoConCarpeta ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${conectadoConCarpeta ? 'bg-emerald-600 text-white' : 'bg-[#082F64] text-white'}`}>
                2
              </span>
              <span>Examinar y elegir carpeta</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Seleccione una carpeta existente de su Drive o cree una nueva con un clic. El sistema arma las subcarpetas automáticamente.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${conectadoConCarpeta ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${conectadoConCarpeta ? 'bg-emerald-600 text-white' : 'bg-[#082F64] text-white'}`}>
                3
              </span>
              <span>Carpetas automáticas y limpieza</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cada tesista obtiene su carpeta propia al subir su 1.er PDF. Al titularse, Secretaría borra su carpeta del Drive en 1 clic.
            </p>
          </div>
        </div>
      </div>

      {/* Estructura Automática Administrada por el Sistema */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-unt-blue" />
          <span>Estructura que el sistema crea y administra automáticamente</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
            <div className="font-bold text-unt-blue flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>📁 Expedientes_Tesistas/</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Crea una subcarpeta individual <code>Nombre Completo (Matrícula)</code> para cada tesista con sus 5 PDFs. Si resube un archivo observado, reemplaza el anterior automáticamente.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-amber-600" />
              <span>📁 Audios_Consultas/</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Almacena las notas de voz reales grabadas por Secretaría. Cuando el tesista confirma <strong>"✓ Duda Resuelta"</strong>, el audio se borra del Drive automáticamente.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>📄 _BD_Sistema_Tesistas_UNT.json</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Base de datos compartida en tiempo real para 10, 50 o 100+ tesistas y múltiples secretarias desde cualquier computadora o celular.
            </p>
          </div>
        </div>
      </div>

      {/* Bloque Técnico: Oculto automáticamente cuando el sistema ya tiene sus llaves configuradas en el servidor */}
      {!driveStatus?.hasEnvCredentials && (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setMostrarConfigAdmin(!mostrarConfigAdmin)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configuración de Llave Google OAuth (Solo Administrador — se configura 1 sola vez)</span>
            {driveStatus?.configured ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                ✓ Configurado
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                Pendiente de activar
              </span>
            )}
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${mostrarConfigAdmin ? 'rotate-90' : ''}`} />
        </button>

        {(mostrarConfigAdmin || !driveStatus?.configured) && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-slate-700 space-y-2 leading-relaxed">
              <p className="font-bold text-unt-blue">
                ¿Qué necesita el administrador para activar el botón "Conectar con Google Drive" una sola vez?
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                <li>
                  Entrar gratis a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-unt-blue font-bold underline">Google Cloud Console</a> (sin tarjeta de crédito) y habilitar <strong>Google Drive API</strong>.
                </li>
                <li>
                  Crear credenciales → <strong>ID de cliente de OAuth (Aplicación web)</strong> y pegar este URI de redirección autorizado:
                  <div className="mt-1 flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-200 font-mono text-[11px] text-slate-800">
                    <span className="truncate flex-1">{driveStatus?.redirectUri || `${window.location.origin}/api/drive/callback`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(driveStatus?.redirectUri || `${window.location.origin}/api/drive/callback`);
                        agregarToast('info', 'Copiado', 'URI de redirección copiado al portapapeles.');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-[10px] cursor-pointer shrink-0"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                </li>
                <li>Pegar abajo el <strong>Client ID</strong> y <strong>Client Secret</strong> (o en las variables de entorno <code>GOOGLE_CLIENT_ID</code> y <code>GOOGLE_CLIENT_SECRET</code> en Render). Luego Secretaría nunca vuelve a tocar esto.</li>
              </ol>
            </div>

            <form onSubmit={handleGuardarCredencialesAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Google OAuth Client ID:</label>
                <input
                  type="text"
                  required
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="1234567890-xxxx.apps.googleusercontent.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Google OAuth Client Secret:</label>
                <input
                  type="password"
                  required
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={cargandoAccion}
                  className="px-4 py-2 rounded-xl bg-unt-blue hover:bg-unt-blue-light text-white font-bold text-xs cursor-pointer"
                >
                  Guardar Llaves Google OAuth
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      )}

      {/* Modal Visual: Examinar Carpetas de Google Drive */}
      {modalExaminarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
          onClick={() => !cargandoAccion && setModalExaminarAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold leading-tight">Examinar mi Google Drive</h3>
                  <p className="text-[11px] text-blue-200">
                    Elija la carpeta donde el sistema creará Expedientes_Tesistas, Audios y la Base de Datos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalExaminarAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Navegación (Breadcrumbs + Buscar + Nueva Carpeta) */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {breadcrumbs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleIrBreadcrumb(breadcrumbs.length - 2)}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer mr-1"
                      title="Subir un nivel"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  {breadcrumbs.map((b, idx) => (
                    <React.Fragment key={b.id}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      <button
                        type="button"
                        onClick={() => handleIrBreadcrumb(idx)}
                        className={`px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                          idx === breadcrumbs.length - 1
                            ? 'bg-blue-100 text-unt-blue font-bold'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {b.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCreandoCarpeta(!creandoCarpeta)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-unt-blue text-unt-blue font-bold text-[11px] cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Nueva carpeta aquí</span>
                </button>
              </div>

              {creandoCarpeta && (
                <form onSubmit={handleCrearNuevaCarpeta} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={nuevoNombreCarpeta}
                    onChange={(e) => setNuevoNombreCarpeta(e.target.value)}
                    placeholder="Ej: Expedientes_Ing_Industrial_UNT"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    disabled={cargandoAccion}
                    className="px-3 py-1.5 rounded-lg bg-unt-blue text-white font-bold text-xs cursor-pointer"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreandoCarpeta(false)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busquedaCarpeta}
                  onChange={(e) => {
                    setBusquedaCarpeta(e.target.value);
                    cargarCarpetasDrive(carpetaActualId, e.target.value);
                  }}
                  placeholder="Buscar carpeta en su Google Drive..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            {/* Lista de Carpetas */}
            <div className="p-3 overflow-y-auto flex-1 min-h-[240px] space-y-1.5">
              {cargandoCarpetas ? (
                <div className="p-10 text-center text-xs text-slate-400">Cargando carpetas de Google Drive...</div>
              ) : carpetas.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                  <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No hay subcarpetas aquí. Puede guardar todo directamente en esta carpeta o crear una nueva arriba.</p>
                </div>
              ) : (
                carpetas.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleEntrarCarpeta(folder)}
                      className="flex items-center gap-2.5 flex-1 text-left cursor-pointer min-w-0"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{folder.name}</span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEntrarCarpeta(folder)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        disabled={cargandoAccion}
                        onClick={() => handleSeleccionarCarpetaDestino(folder.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Elegir esta
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Opción Rápida: Pegar Enlace de Carpeta Compartida + Guardar en Carpeta Actual */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={enlaceCarpetaManual}
                    onChange={(e) => setEnlaceCarpetaManual(e.target.value)}
                    placeholder="O pegue aquí el enlace de una carpeta de Google Drive (ej. carpeta compartida)..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                  />
                </div>
                {enlaceCarpetaManual.trim() && (
                  <button
                    type="button"
                    disabled={cargandoAccion}
                    onClick={() => handleSeleccionarCarpetaDestino(enlaceCarpetaManual.trim())}
                    className="px-3.5 py-2 rounded-xl bg-unt-blue text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    Usar enlace
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500">
                  Carpeta abierta: <strong className="text-slate-800">{breadcrumbs[breadcrumbs.length - 1]?.name}</strong>
                </span>
                <button
                  type="button"
                  disabled={cargandoAccion}
                  onClick={() => handleSeleccionarCarpetaDestino(carpetaActualId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {cargandoAccion
                      ? 'Creando estructura...'
                      : `Guardar todos los expedientes en "${breadcrumbs[breadcrumbs.length - 1]?.name}"`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
