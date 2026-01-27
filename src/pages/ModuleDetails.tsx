import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/butlerDB';
import { generateModuleContext } from '../utils/llmExporter';
import { parseClipboardData } from '../utils/osParser';

export default function ModuleDetails() {
    const { moduleId } = useParams();
    const navigate = useNavigate();

    // UI State
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [manualPasteContent, setManualPasteContent] = useState('');

    // New Help Modals State
    const [showEntityHelp, setShowEntityHelp] = useState(false);
    const [showActionHelp, setShowActionHelp] = useState(false);

    // 1. Fetch Context
    const module = useLiveQuery(() => db.modules.get(moduleId!), [moduleId]);
    const entities = useLiveQuery(() => db.entities.where({ moduleId: moduleId! }).toArray(), [moduleId]);
    const actions = useLiveQuery(() => db.actions.where({ moduleId: moduleId! }).toArray(), [moduleId]);

    // Action: Copy JSON for LLM
    const handleCopyContext = () => {
        if (!module || !entities) return;
        const jsonContext = generateModuleContext(module, entities, actions || []);
        navigator.clipboard.writeText(jsonContext);
        alert("Context copied to clipboard!");
    };

    // Logic: Process the text
    const processXML = async (text: string) => {
        try {
            const { entities: newEntities, actions: newActions } = parseClipboardData(text, moduleId!);

            let msg = "";
            if (newEntities.length > 0) {
                await db.entities.bulkAdd(newEntities);
                msg += `Imported ${newEntities.length} Entities. `;
            }
            if (newActions.length > 0) {
                await db.actions.bulkAdd(newActions);
                msg += `Imported ${newActions.length} Actions.`;
            }

            if (!msg) {
                alert("No valid data found. Ensure you are using the correct XML format.");
                return;
            }

            setShowPasteModal(false);
            setManualPasteContent('');
            alert("Success! " + msg);

        } catch (error) {
            console.error(error);
            alert("Import failed. Check console for details.");
        }
    };

    if (!module) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 relative">
            <div className="max-w-6xl mx-auto">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-blue-600">Projects</Link>
                    <span>/</span>
                    <Link to={`/project/${module.projectId}`} className="hover:text-blue-600">Project</Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-800">{module.name}</span>
                </div>

                {/* Header */}
                <header className="flex justify-between items-end mb-8 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{module.name}</h1>
                        <p className="text-gray-500">{module.layer} Module</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEntityHelp(true)}
                            className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-2 rounded text-xs font-bold hover:bg-blue-100 transition"
                        >
                            ❓ How to Entities
                        </button>

                        <button
                            onClick={() => setShowPasteModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition flex items-center gap-2"
                        >
                            📋 Import
                        </button>

                        <button
                            onClick={() => navigate(`/module/${moduleId}/diagram`)}
                            className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 rounded shadow-sm hover:bg-orange-200 transition font-medium flex items-center gap-2"
                        >
                            🕸️ Diagram
                        </button>

                        <button
                            onClick={handleCopyContext}
                            className="bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded shadow-sm hover:bg-purple-200 transition font-medium flex items-center gap-2"
                        >
                            ✨ Copy for AI
                        </button>

                        <button
                            onClick={() => navigate(`/module/${moduleId}/entity/new`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <span>+</span> New Entity
                        </button>
                    </div>
                </header>

                {/* Entities Grid */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">Database Entities</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {entities?.map((ent) => (
                        <div
                            key={ent.id}
                            onClick={() => navigate(`/module/${moduleId}/entity/${ent.id}`)}
                            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-blue-900 group-hover:text-blue-600">
                                    {ent.name}
                                </h3>
                                {ent.isStatic && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Static</span>}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 h-10">{ent.description || "No description provided."}</p>
                            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                                <span>{ent.attributes.length} Attributes</span>
                                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </div>
                        </div>
                    ))}
                    {entities?.length === 0 && (
                        <div className="col-span-3 text-center py-12 bg-white rounded border border-dashed border-gray-300">
                            <p className="text-gray-400">No entities defined yet.</p>
                            <button
                                onClick={() => setShowPasteModal(true)}
                                className="text-green-600 font-semibold mt-2 hover:underline"
                            >
                                Paste from Service Studio
                            </button>
                        </div>
                    )}
                </div>

                {/* --- SEPARATOR --- */}
                <div className="border-t border-gray-200 my-10"></div>

                {/* Logic Grid */}
                <header className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Logic & Actions</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowActionHelp(true)}
                            className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-2 rounded text-xs font-bold hover:bg-orange-100 transition"
                        >
                            ❓ How to Actions
                        </button>
                        <button
                            onClick={() => setShowPasteModal(true)}
                            className="bg-white border border-green-600 text-green-700 px-4 py-2 rounded hover:bg-green-50 transition font-medium flex items-center gap-2"
                        >
                            📋 Import Actions
                        </button>
                        <button
                            onClick={() => navigate(`/module/${moduleId}/action/new`)}
                            className="text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded hover:bg-blue-100 transition font-medium"
                        >
                            + New Action
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-12">
                    {actions?.map((act) => (
                        <div
                            key={act.id}
                            onClick={() => navigate(`/module/${moduleId}/action/${act.id}`)}
                            className="bg-white p-4 rounded border border-gray-200 hover:border-orange-400 cursor-pointer shadow-sm group transition"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${act.type === 'Server' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                    <h3 className="font-bold text-gray-800 group-hover:text-orange-600">{act.name}</h3>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 border px-1 rounded">{act.type}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{act.description || "No description"}</p>

                            <div className="mt-3 flex gap-2 overflow-hidden flex-wrap">
                                {act.inputs.map(i => (
                                    <span key={i.id} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 border">
                                        In: {i.name}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 items-center">
                                <span className="text-xs text-gray-400">{act.nodes?.length || 0} nodes</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/module/${moduleId}/action/${act.id}/diagram`);
                                    }}
                                    className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded border border-orange-200 hover:bg-orange-100 font-semibold"
                                >
                                    View Flow &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                    {actions?.length === 0 && <p className="text-gray-400 italic text-sm">No actions defined.</p>}
                </div>

            </div>

            {/* --- HELP MODAL: ENTITIES --- */}
            {showEntityHelp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">How to Generate Entities with LLMs</h3>
                        <p className="text-sm text-gray-600 mb-4">Copy the prompt below and paste it into ChatGPT/Claude to generate compatible XML.</p>

                        <div className="bg-gray-800 text-gray-100 p-4 rounded text-xs font-mono overflow-auto max-h-96">
                            {`Please generate an XML block for an OutSystems Entity named "[ENTITY_NAME]". 
Use the structure below.
- Supported Data Types: Text, Integer, LongInteger, Decimal, Boolean, DateTime, Date, Binary, Currency, Email, Phone.
- Use "IsIdentifier" for Primary Keys.
- Use "IsMandatory" for required fields.

EXAMPLE STRUCTURE:
<Entity Name="Customer" Description="Stores customer profiles" IsPublic="true">
    <Attributes>
        <EntityAttribute Name="Id" Type="LongInteger" IsIdentifier="true" />
        <EntityAttribute Name="Name" Type="Text" Length="100" IsMandatory="true" />
        <EntityAttribute Name="Email" Type="Email" Length="255" />
        <EntityAttribute Name="IsActive" Type="Boolean" />
        <EntityAttribute Name="CreatedAt" Type="DateTime" />
    </Attributes>
</Entity>`}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setShowEntityHelp(false)} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HELP MODAL: ACTIONS --- */}
            {showActionHelp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl">
                        <h3 className="text-xl font-bold text-orange-900 mb-2">How to Generate Actions with LLMs</h3>
                        <p className="text-sm text-gray-600 mb-4">Copy the prompt below to generate Logic Flows compatible with the visualizer.</p>

                        <div className="bg-gray-800 text-gray-100 p-4 rounded text-xs font-mono overflow-auto max-h-96">
                            {`Please generate an OutSystems XML ServerAction named "[ACTION_NAME]" that performs [DESCRIPTION].
Follow this strict schema for nodes and connections (Links).

Supported Nodes: Start, End, If, Switch, Assign, ExecuteServerAction.

EXAMPLE STRUCTURE:
<ServerAction Name="ValidateUser" Description="Checks user age and role">
    <InputParameter Name="Age" Type="Integer" IsMandatory="true" />
    <OutputParameter Name="IsValid" Type="Boolean" />
    
    <Flow>
        <Start Name="Start" />
        
        <If Name="CheckAge">
            <Condition>Age >= 18</Condition>
        </If>
        
        <Assign Name="SetValid">
            <Assignment Variable="IsValid" Value="True" />
        </Assign>
        
        <Assign Name="SetInvalid">
            <Assignment Variable="IsValid" Value="False" />
        </Assign>
        
        <End Name="End" />
        
        <Link Source="Start" Target="CheckAge" />
        <Link Source="CheckAge" Target="SetValid" Label="True" />
        <Link Source="CheckAge" Target="SetInvalid" Label="False" />
        <Link Source="SetValid" Target="End" />
        <Link Source="SetInvalid" Target="End" />
    </Flow>
</ServerAction>`}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setShowActionHelp(false)} className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MANUAL PASTE MODAL --- */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Import from Service Studio</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Copy <b>Entities</b> or <b>Actions</b> from Service Studio (Ctrl+C) and paste below.
                        </p>

                        <textarea
                            className="w-full flex-grow p-4 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none min-h-[200px]"
                            placeholder="Paste XML here (Entities or Actions)..."
                            value={manualPasteContent}
                            onChange={(e) => setManualPasteContent(e.target.value)}
                            autoFocus
                        />

                        <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setShowPasteModal(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => processXML(manualPasteContent)}
                                className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition"
                            >
                                Import Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}