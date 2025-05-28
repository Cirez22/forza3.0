import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  Timer,
  PauseCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import type { Project, ProgressLog, Client } from './types';
import ProgressUpdateModal from './ProgressUpdateModal';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectAndClient();
    }
  }, [id]);

  const fetchProjectAndClient = async () => {
    try {
      setLoading(true);
      
      // First, fetch the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      
      // Then, if there's a client_id, fetch the client
      if (projectData.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, name, email, phone, address')
          .eq('id', projectData.client_id)
          .single();

        if (clientError) {
          console.error('Error fetching client:', clientError);
        } else {
          setClient(clientData);
        }
      }

      setProject(projectData);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (
    newProgress: number,
    newStatus: 'active' | 'completed' | 'on_hold',
    log: ProgressLog | null
  ) => {
    try {
      const updates = {
        progress: newProgress,
        status: newStatus,
        ...(log && { progress_logs: [...(project?.progress_logs || []), log] })
      };

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project?.id);

      if (error) throw error;

      setProject(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Error al actualizar el progreso');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${project?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Add file reference to project_files table
      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: project?.id,
          file_name: file.name,
          file_url: filePath,
          file_size: file.size,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      // Refresh project data
      await fetchProjectAndClient();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project?.id);

      if (error) throw error;

      navigate('/dashboard/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Error al eliminar el proyecto');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'on_hold':
        return <PauseCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Timer className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Proyecto no encontrado</h2>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/projects')}
          className="mt-4"
        >
          Volver a Proyectos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {project.address}
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteProject}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <div className="mt-1 flex items-center">
                  {getStatusIcon(project.status)}
                  <span className="ml-2 capitalize">{project.status}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <div className="mt-1 capitalize">{project.project_type}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha Inicio
                </label>
                <div className="mt-1">
                  {format(new Date(project.start_date), 'dd/MM/yyyy')}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha Fin
                </label>
                <div className="mt-1">
                  {project.end_date
                    ? format(new Date(project.end_date), 'dd/MM/yyyy')
                    : 'No definida'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valor</label>
                <div className="mt-1">
                  ${project.value.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Progreso</h2>
              <Button
                variant="outline"
                onClick={() => setShowProgressModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black rounded-full h-2"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="ml-4 text-sm font-medium">
                  {project.progress}%
                </span>
              </div>
            </div>

            {project.progress_logs && project.progress_logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Historial de Actualizaciones
                </h3>
                <div className="space-y-3">
                  {project.progress_logs.map((log, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-md p-3"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {format(new Date(log.date), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span>{log.progress}%</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Archivos</h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  type="button"
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Subir Archivo'}
                </Button>
              </label>
            </div>

            {project.files && project.files.length > 0 ? (
              <div className="space-y-2">
                {project.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">
                        {file.file_name}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.file_url)}
                    >
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay archivos adjuntos
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            {client ? (
              <div>
                <h3 className="font-medium">{client.name}</h3>
                <p className="text-sm text-gray-500">{client.email}</p>
                {client.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    {client.phone}
                  </p>
                )}
                {client.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {client.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin cliente asignado</p>
            )}
          </div>

          {project.description && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Descripción</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {showProgressModal && (
        <ProgressUpdateModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          currentProgress={project.progress}
          currentStatus={project.status}
          progressLogs={project.progress_logs || []}
          onUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
};

export default ProjectDetails;