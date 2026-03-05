import React, { useState, useEffect } from 'react';
import { Nucleo } from '../types/census';
import { Plus, Trash2, Edit2, Save, X, Stethoscope, AlertCircle } from 'lucide-react';

interface NucleoManagerProps {
  token: string;
}

export default function NucleoManager({ token }: NucleoManagerProps) {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Nucleo>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newData, setNewData] = useState<Partial<Nucleo>>({
    nombre: '',
    medico_nombre: '',
    medico_cedula: ''
  });

  useEffect(() => {
    fetchNucleos();
  }, []);

  const fetchNucleos = async () => {
    try {
      const response = await fetch('/api/nucleos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNucleos(data);
    } catch (error) {
      console.error('Error fetching nucleos:', error);
    }
  };

  const handleAdd = async () => {
    if (!newData.nombre || !newData.medico_nombre || !newData.medico_cedula) {
      setError('Por favor complete todos los campos');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const response = await fetch('/api/nucleos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newData)
      });
      if (response.ok) {
        setIsAdding(false);
        setNewData({ nombre: '', medico_nombre: '', medico_cedula: '' });
        fetchNucleos();
      }
    } catch (error) {
      console.error('Error adding nucleo:', error);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch(`/api/nucleos/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setIsEditing(null);
        fetchNucleos();
      }
    } catch (error) {
      console.error('Error updating nucleo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    // Removed confirm() due to sandbox restrictions
    try {
      const response = await fetch(`/api/nucleos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchNucleos();
      }
    } catch (error) {
      console.error('Error deleting nucleo:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-serif italic text-[#141414]">Gestión de Núcleos Básicos</h2>
          <p className="text-sm text-[#141414]/60">Administre los núcleos de salud y sus médicos responsables</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-lg hover:bg-[#141414]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Núcleo
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white border border-[#141414]/10 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="font-serif italic text-lg mb-4">Agregar Nuevo Núcleo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              placeholder="Nombre del Núcleo"
              className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
              value={newData.nombre}
              onChange={e => setNewData({ ...newData, nombre: e.target.value })}
            />
            <input
              placeholder="Médico Responsable"
              className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
              value={newData.medico_nombre}
              onChange={e => setNewData({ ...newData, medico_nombre: e.target.value })}
            />
            <input
              placeholder="Cédula Profesional"
              className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
              value={newData.medico_cedula}
              onChange={e => setNewData({ ...newData, medico_cedula: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-[#141414]/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#141414]/90 transition-colors"
            >
              Guardar Núcleo
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {nucleos.map(nucleo => (
          <div
            key={nucleo.id}
            className="bg-white border border-[#141414]/10 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            {isEditing === nucleo.id ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
                <input
                  className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
                  value={editData.nombre}
                  onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                />
                <input
                  className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
                  value={editData.medico_nombre}
                  onChange={e => setEditData({ ...editData, medico_nombre: e.target.value })}
                />
                <input
                  className="border border-[#141414]/10 rounded-lg p-2 font-mono text-sm"
                  value={editData.medico_cedula}
                  onChange={e => setEditData({ ...editData, medico_cedula: e.target.value })}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-[#141414]/40" />
                </div>
                <div>
                  <h4 className="font-serif italic text-lg text-[#141414]">{nucleo.nombre}</h4>
                  <p className="text-sm text-[#141414]/60">
                    Dr. {nucleo.medico_nombre} | Cédula: {nucleo.medico_cedula}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isEditing === nucleo.id ? (
                <>
                  <button
                    onClick={() => handleUpdate(nucleo.id!)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsEditing(null)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(nucleo.id!);
                      setEditData(nucleo);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(nucleo.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {nucleos.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-[#141414]/5 rounded-xl border border-dashed border-[#141414]/20">
            <p className="text-[#141414]/40 font-serif italic">No hay núcleos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
