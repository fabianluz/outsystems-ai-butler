import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db, type Module } from '../db/butlerDB';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'Foundation' | 'Core' | 'End-User'>('Core');

  const project = useLiveQuery(() => db.projects.get(projectId!), [projectId]);
  
  const modules = useLiveQuery(
    () => db.modules.where({ projectId: projectId! }).toArray(),
    [projectId]
  );

  const handleAddModule = async () => {
    if (!newModuleName || !projectId) return;

    const newModule: Module = {
      id: uuidv4(),
      projectId: projectId,
      name: newModuleName,
      layer: selectedLayer,
      description: '',
    };

    await db.modules.add(newModule);
    setNewModuleName('');
  };

  const handleDeleteModule = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop the click from triggering the card navigation
    await db.modules.delete(id);
    // Cleanup entities inside this module (Optional but good practice)
    await db.entities.where({ moduleId: id }).delete();
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'End-User': return 'bg-green-100 text-green-800 border-green-200';
      case 'Core': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Foundation': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100';
    }
  };

  if (!project) return <div className="p-8">Loading project...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Projects</Link>
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
          <span className={`inline-block text-xs px-2 py-1 rounded mt-2 font-bold ${
             project.platform === 'ODC' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
          }`}>
            {project.platform} Environment
          </span>
        </header>

        {/* Add Module */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Module</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Module Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2"
                placeholder="e.g., Customer_CS"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Layer</label>
              <select 
                className="w-full border border-gray-300 rounded p-2"
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(e.target.value as any)}
              >
                <option value="End-User">End-User</option>
                <option value="Core">Core</option>
                <option value="Foundation">Foundation</option>
              </select>
            </div>
            <button 
              onClick={handleAddModule}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition h-[42px]"
            >
              Add
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Modules</h2>
        <div className="grid grid-cols-1 gap-3">
          {modules?.map((mod) => (
            <div 
              key={mod.id} 
              onClick={() => navigate(`/module/${mod.id}`)} // <--- THIS IS THE FIX
              className="bg-white p-4 rounded border border-gray-200 flex justify-between items-center hover:shadow-md hover:border-blue-400 transition cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded text-xs font-bold border ${getLayerColor(mod.layer)}`}>
                  {mod.layer}
                </div>
                <span className="font-semibold text-gray-800 text-lg group-hover:text-blue-600 transition">{mod.name}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-sm text-gray-400 group-hover:text-blue-500 transition">Open &rarr;</span>
                <button 
                  onClick={(e) => handleDeleteModule(e, mod.id)}
                  className="text-gray-300 hover:text-red-500 pl-4 border-l ml-2"
                  title="Delete Module"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {modules?.length === 0 && <p className="text-gray-400 italic">No modules defined yet.</p>}
        </div>

      </div>
    </div>
  );
}