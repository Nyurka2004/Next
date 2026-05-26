'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ImageModal from '@/components/ImageModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { GalleryImage } from '@/lib/database.types';

export default function Home() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch images
  const fetchImages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/images?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar imágenes');

      const data = await res.json();
      setImages(data);
    } catch (error) {
      toast.error('Error al cargar imágenes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchImages();
  }, [fetchImages]);

  // Upload image to Vercel Blob
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Error al subir imagen');
    const data = await res.json();
    return data.url;
  };

  // Create image
  const handleCreate = async (data: { title: string; description: string; file?: File }) => {
    try {
      if (!data.file) {
        toast.error('Debes seleccionar una imagen');
        return;
      }

      const toastId = toast.loading('Subiendo imagen...');
      const imageUrl = await uploadImage(data.file);

      toast.loading('Creando registro...', { id: toastId });

      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          image_url: imageUrl,
          blob_url: imageUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear');
      }

      toast.success('Imagen creada exitosamente', { id: toastId });
      setShowCreateModal(false);
      fetchImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear imagen');
    }
  };

  // Edit image
  const handleEdit = async (data: { title: string; description: string; file?: File }) => {
    try {
      if (!selectedImage) return;

      const toastId = toast.loading('Guardando cambios...');
      let imageUrl = selectedImage.image_url;
      let blobUrl = selectedImage.blob_url;

      if (data.file) {
        toast.loading('Subiendo nueva imagen...', { id: toastId });
        imageUrl = await uploadImage(data.file);
        blobUrl = imageUrl;
      }

      const res = await fetch('/api/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedImage.id,
          title: data.title,
          description: data.description,
          image_url: imageUrl,
          blob_url: blobUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar');
      }

      toast.success('Imagen actualizada exitosamente', { id: toastId });
      setShowEditModal(false);
      setSelectedImage(null);
      fetchImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar imagen');
    }
  };

  // Delete image
  const handleDelete = async () => {
    if (!selectedImage) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/images?id=${selectedImage.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }

      toast.success('Imagen eliminada exitosamente');
      setShowDeleteModal(false);
      setSelectedImage(null);
      fetchImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar imagen');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Galería de Imágenes</h1>
                <p className="text-xs text-gray-500">CRUD con Next.js, Supabase y Vercel Blob</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título..."
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Add button */}
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm shadow-lg shadow-blue-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva imagen</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 text-sm">Cargando imágenes...</p>
          </div>
        ) : images.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {debouncedSearch ? 'Sin resultados' : 'No hay imágenes'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {debouncedSearch
                ? `No se encontraron imágenes con "${debouncedSearch}"`
                : 'Comienza agregando tu primera imagen'}
            </p>
            {debouncedSearch ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-lg shadow-blue-500/25"
              >
                Agregar imagen
              </button>
            )}
          </div>
        ) : (
          /* Gallery grid - 4 columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedImage(image);
                        setShowEditModal(true);
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl text-gray-700 hover:bg-white hover:text-blue-600 transition-all shadow-lg"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImage(image);
                        setShowDeleteModal(true);
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl text-gray-700 hover:bg-white hover:text-red-600 transition-all shadow-lg"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{image.title}</h3>
                  {image.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{image.description}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(image.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ImageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      <ImageModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedImage(null);
        }}
        onSubmit={handleEdit}
        editImage={selectedImage}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedImage(null);
        }}
        onConfirm={handleDelete}
        title={selectedImage?.title || ''}
        loading={deleteLoading}
      />
    </div>
  );
}