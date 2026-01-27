import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db, type Entity, type Attribute, type DataType } from '../db/butlerDB';

const DATA_TYPES: DataType[] = ['Text', 'Integer', 'LongInteger', 'Decimal', 'Boolean', 'DateTime', 'Date', 'Identifier', 'Binary'];

export default function EntityEditor() {
  const { moduleId, entityId } = useParams();
  const navigate = useNavigate();
  const isNew = entityId === 'new';

  // State for the Entity Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isStatic, setIsStatic] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Load Data if editing
  useEffect(() => {
    if (!isNew && entityId) {
      db.entities.get(entityId).then((ent) => {
        if (ent) {
          setName(ent.name);
          setDescription(ent.description);
          setIsStatic(ent.isStatic);
          setAttributes(ent.attributes);
        }
      });
    } else {
      // Default Attribute for new entities (Id)
      setAttributes([{
        id: uuidv4(), name: 'Id', dataType: 'LongInteger', isMandatory: true, isIdentifier: true
      }]);
    }
  }, [entityId, isNew]);

  // --- Attribute Logic ---
  const addAttribute = () => {
    setAttributes([
      ...attributes,
      { id: uuidv4(), name: '', dataType: 'Text', length: 50, isMandatory: false, isIdentifier: false }
    ]);
  };

  const updateAttribute = (id: string, field: keyof Attribute, value: any) => {
    setAttributes(attributes.map(attr => 
      attr.id === id ? { ...attr, [field]: value } : attr
    ));
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter(attr => attr.id !== id));
  };

  // --- Save Logic ---
  const handleSave = async () => {
    if (!name || !moduleId) return;

    const entityData: Entity = {
      id: isNew ? uuidv4() : entityId!,
      moduleId,
      name,
      description,
      isStatic,
      isPublic: false, // Default
      attributes
    };

    await db.entities.put(entityData); // .put() works for both Create and Update
    navigate(-1); // Go back
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-gray-800 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'Create Entity' : `Edit ${name}`}</h1>
            <p className="text-gray-400 text-sm">Define your data structure for the LLM context.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold transition">Save Entity</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-8">
          
          {/* Main Info */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Entity Name</label>
              <input 
                value={name} onChange={e => setName(e.target.value)} 
                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" 
                placeholder="e.g. Customer" 
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description (Context)</label>
              <input 
                value={description} onChange={e => setDescription(e.target.value)} 
                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" 
                placeholder="What does this table store?" 
              />
            </div>
          </div>

          {/* Attributes Table */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Attributes</h2>
            <button onClick={addAttribute} className="text-blue-600 text-sm font-bold hover:underline">+ Add Attribute</button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3 w-8">PK</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3 w-24">Length</th>
                  <th className="p-3 w-24 text-center">Mandatory</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-gray-50 group">
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={attr.isIdentifier} 
                        onChange={e => updateAttribute(attr.id, 'isIdentifier', e.target.checked)}
                        className="accent-red-500"
                        title="Is Identifier?"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        value={attr.name} 
                        onChange={e => updateAttribute(attr.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-medium" 
                        placeholder="Attribute Name"
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        value={attr.dataType} 
                        onChange={e => updateAttribute(attr.id, 'dataType', e.target.value)}
                        className="w-full bg-transparent outline-none cursor-pointer"
                      >
                        {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      {attr.dataType === 'Text' && (
                        <input 
                          type="number" 
                          value={attr.length || 50} 
                          onChange={e => updateAttribute(attr.id, 'length', parseInt(e.target.value))}
                          className="w-full bg-transparent outline-none text-gray-500"
                        />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={attr.isMandatory} 
                        onChange={e => updateAttribute(attr.id, 'isMandatory', e.target.checked)}
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => removeAttribute(attr.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}