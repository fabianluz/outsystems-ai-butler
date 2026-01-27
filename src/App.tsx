import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/butlerDB';
import ProjectDetails from './pages/ProjectDetails';
import ModuleDetails from './pages/ModuleDetails';
import EntityEditor from './pages/EntityEditor';
import ActionEditor from './pages/ActionEditor';
import ModuleDiagram from './pages/ModuleDiagram'; // <--- Restored Import
import ActionDiagram from './pages/ActionDiagram'; // <--- Restored Import

// --- COMPONENT: The Project List (Home Page) ---
function ProjectList() {
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'O11' | 'ODC'>('O11');

  const navigate = useNavigate();
  const projects = useLiveQuery(() => db.projects.toArray());

  const handleAddProject = async () => {
    if (!newProjectName) return;
    const id = uuidv4();

    await db.projects.add({
      id,
      name: newProjectName,
      platform: selectedPlatform,
      description: '',
      createdAt: new Date(),
    });

    setNewProjectName('');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await db.projects.delete(id);
    await db.modules.where({ projectId: id }).delete();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">🤖 OutSystems AI Butler</h1>
        <p className="text-gray-500">Local-first context manager for LLMs</p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex gap-4">
          <div className="w-32 flex-shrink-0">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as 'O11' | 'ODC')}
              className="w-full border border-gray-300 rounded p-3 bg-gray-50 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="O11">O11</option>
              <option value="ODC">ODC</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="New Project Name..."
            className="border border-gray-300 rounded p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
          />

          <button
            onClick={handleAddProject}
            className="bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 transition"
          >
            Create
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          {selectedPlatform === 'O11' ? 'Traditional/Reactive Architecture (Modules)' : 'Cloud Native Architecture (Apps/Libraries)'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects?.map((proj) => (
          <div
            key={proj.id}
            onClick={() => navigate(`/project/${proj.id}`)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">{proj.name}</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded mt-2 font-bold ${proj.platform === 'ODC'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {proj.platform}
                </span>
              </div>
              <button
                onClick={(e) => handleDelete(e, proj.id)}
                className="text-gray-300 hover:text-red-500 p-2"
                title="Delete Project"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Routes>
        {/* Project Level */}
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:projectId" element={<ProjectDetails />} />

        {/* Module Level */}
        <Route path="/module/:moduleId" element={<ModuleDetails />} />

        {/* Editors */}
        <Route path="/module/:moduleId/entity/:entityId" element={<EntityEditor />} />
        <Route path="/module/:moduleId/action/:actionId" element={<ActionEditor />} />

        {/* Diagrams */}
        <Route path="/module/:moduleId/diagram" element={<ModuleDiagram />} />
        <Route path="/module/:moduleId/action/:actionId/diagram" element={<ActionDiagram />} />
      </Routes>
    </div>
  );
}

export default App;