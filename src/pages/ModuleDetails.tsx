import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/butlerDB';
import { generateModuleContext } from '../utils/llmExporter';
import { parseClipboardData } from '../utils/osParser';
import { generateOSXML } from '../utils/xmlExporter';

export default function ModuleDetails() {
    const { moduleId } = useParams();
    const navigate = useNavigate();

    // UI State
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [manualPasteContent, setManualPasteContent] = useState('');

    // Help Modals State
    const [showEntityHelp, setShowEntityHelp] = useState(false);
    const [showActionHelp, setShowActionHelp] = useState(false);
    const [showPromptsModal, setShowPromptsModal] = useState(false);

    // 1. Fetch Context
    const module = useLiveQuery(() => db.modules.get(moduleId!), [moduleId]);
    const entities = useLiveQuery(() => db.entities.where({ moduleId: moduleId! }).toArray(), [moduleId]);
    const actions = useLiveQuery(() => db.actions.where({ moduleId: moduleId! }).toArray(), [moduleId]);

    // Action: Copy JSON for LLM
    const handleCopyContext = () => {
        if (!module || !entities) return;
        const jsonContext = generateModuleContext(module, entities, actions || []);
        navigator.clipboard.writeText(jsonContext);
        alert("Context copied to clipboard! Paste this into ChatGPT/Claude to start.");
    };

    const handleExportXML = () => {
        if (!entities || !actions || !module) return;
        const xmlContent = generateOSXML(entities, actions);
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module.name}_Export.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteEntity = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this entity?')) await db.entities.delete(id);
    };

    const handleDeleteAction = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this action?')) await db.actions.delete(id);
    };

    const processXML = async (xml: string) => {
        if (!moduleId) return;
        try {
            const { entities: newEnts, actions: newActs } = parseClipboardData(xml, moduleId);
            if (newEnts.length > 0) await db.entities.bulkAdd(newEnts);
            if (newActs.length > 0) await db.actions.bulkAdd(newActs);
            setShowPasteModal(false);
            setManualPasteContent('');
            alert(`Imported ${newEnts.length} Entities and ${newActs.length} Actions.`);
        } catch (e) {
            alert("Error importing XML. Check console.");
            console.error(e);
        }
    };

    if (!module) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 relative">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-black font-bold text-xl" title="Back to Project">&larr;</button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{module.name}</h1>
                            <span className="text-sm text-gray-500 uppercase tracking-widest">{module.layer} Layer</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setShowPromptsModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition flex items-center gap-2" title="Get Prompt Templates for AI">
                            <span>💡</span> Suggested Prompts
                        </button>
                        <div className="w-px bg-gray-300 mx-1 h-8"></div>
                        <button onClick={handleExportXML} className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition flex items-center gap-2" title="Download XML Backup">
                            <span>💾</span> Export XML
                        </button>
                        <button onClick={handleCopyContext} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition flex items-center gap-2" title="Copy Context JSON">
                            <span>✨</span> Copy for AI
                        </button>
                        <button onClick={() => setShowPasteModal(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition flex items-center gap-2" title="Import XML">
                            <span>📋</span> Import
                        </button>
                        <Link to={`/module/${moduleId}/diagram`} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition flex items-center gap-2" title="Visualize ERD">
                            <span>🕸️</span> Diagram
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* ENTITIES SECTION */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-700">Database Entities</h2>
                                <button onClick={() => setShowEntityHelp(true)} className="text-gray-400 hover:text-blue-500 text-sm" title="How to generate entities">❓ Help</button>
                            </div>
                            <Link to={`/module/${moduleId}/entity/new`} className="text-blue-600 font-bold hover:underline">+ New Entity</Link>
                        </div>

                        {entities?.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded text-gray-400">
                                No entities yet. Import or create one.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {entities?.map(ent => (
                                    <Link key={ent.id} to={`/module/${moduleId}/entity/${ent.id}`} className="block p-3 border rounded hover:border-blue-400 hover:shadow-sm transition group relative bg-gray-50">
                                        <div className="font-bold text-gray-800">{ent.name}</div>
                                        <div className="text-xs text-gray-500">{ent.attributes.length} attributes {ent.isPublic ? '• Public' : ''}</div>
                                        <button onClick={(e) => handleDeleteEntity(e, ent.id)} className="absolute right-3 top-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100" title="Delete">🗑️</button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* LOGIC SECTION */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-700">Logic & Actions</h2>
                                <button onClick={() => setShowActionHelp(true)} className="text-gray-400 hover:text-blue-500 text-sm" title="How to generate actions">❓ Help</button>
                            </div>
                            <Link to={`/module/${moduleId}/action/new`} className="text-blue-600 font-bold hover:underline">+ New Action</Link>
                        </div>

                        {actions?.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded text-gray-400">
                                No actions yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {actions?.map(act => (
                                    <div key={act.id} className="block p-3 border rounded hover:border-blue-400 hover:shadow-sm transition group relative bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    {act.name}
                                                    <span className={`text-[10px] px-1 rounded border ${act.type === 'Client' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{act.type}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[300px]">{act.description || "No description"}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/module/${moduleId}/action/${act.id}`} className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100">Edit</Link>
                                                <Link to={`/module/${moduleId}/action/${act.id}/diagram`} className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100 hidden">View Flow</Link>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDeleteAction(e, act.id)} className="absolute -right-2 -top-2 bg-white rounded-full border p-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100" title="Delete">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MODAL: SUGGESTED PROMPTS --- */}
                {showPromptsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">🤖 AI Prompts Library</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                Use these optimized system prompts to force ChatGPT/Claude to generate valid OutSystems XML that you can import directly into this tool.
                            </p>

                            <div className="space-y-4">
                                {/* Prompt 1: The Master System Prompt */}
                                <details className="group border border-gray-200 rounded-lg overflow-hidden" open>
                                    <summary className="p-4 bg-gray-50 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🏆</span>
                                            <span>The "Master" Import Prompt (Use this first)</span>
                                        </div>
                                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="p-4 bg-white border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2">This prompts teaches the AI exactly how to structure the XML for this application.</p>
                                        <div className="bg-gray-900 text-green-100 p-4 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
                                            {`You are an expert OutSystems Architect. I am using a "Digital Twin" tool that imports OutSystems XML code.
When I ask you to generate code, you MUST return it inside a single <ClipboardData> XML block.

Supported XML Schema:

1. ENTITIES:
<Entity Name="Name" Description="..." IsPublic="true">
  <Attributes>
    <EntityAttribute Name="Id" Type="LongInteger" IsIdentifier="true" />
    <EntityAttribute Name="Name" Type="Text" Length="100" IsMandatory="true" />
  </Attributes>
</Entity>

2. ACTIONS (Server/Client):
<ServerAction Name="ActionName" Description="...">
  <InputParameter Name="In1" Type="Text" />
  <OutputParameter Name="Out1" Type="Boolean" />
  <Variable Name="Var1" Type="Integer" />
  <Flow>
    <Start Name="Start" />
    <Assign Name="SetVars">
       <Assignment Variable="Var1" Value="10" />
    </Assign>
    <If Name="Check">
       <Condition>Var1 > 5</Condition>
    </If>
    <Switch Name="Switch1">
       <Case Condition="Var1 = 1">Target1</Case>
       <Default>TargetDefault</Default>
    </Switch>
    <ExecuteServerAction Name="CallAct">
       <Action Name="OtherAction" />
    </ExecuteServerAction>
    <SQL Name="RunQuery" SQL="SELECT * FROM {Entity}" />
    <JavaScript Name="RunJS" Code="console.log('hi');" />
    <End Name="End" />
    
    <Link Source="Start" Target="SetVars" />
    <Link Source="SetVars" Target="Check" />
    <Link Source="Check" Target="RunQuery" Label="True" />
    <Link Source="Check" Target="End" Label="False" />
  </Flow>
</ServerAction>

Always ensure <Link> tags connect the flow logic. Use "Label" for If (True/False) and Switch cases.`}
                                        </div>
                                    </div>
                                </details>

                                {/* Prompt 2: Data Modeling */}
                                <details className="group border border-gray-200 rounded-lg overflow-hidden">
                                    <summary className="p-4 bg-gray-50 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">📦</span>
                                            <span>Generate Data Model (Entities)</span>
                                        </div>
                                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="p-4 bg-white border-t border-gray-100">
                                        <div className="bg-gray-100 p-3 rounded text-xs font-mono cursor-pointer hover:bg-gray-200 transition" onClick={() => navigator.clipboard.writeText('Based on the Master Prompt, generate an OutSystems XML block defining an E-Commerce Database. Include 3 Entities: "Product" (SKU, Name, Price), "Customer" (Name, Email), and "Order" (Date, Total, Status). Ensure proper IDs and Foreign Keys.')}>
                                            Based on the Master Prompt, generate an OutSystems XML block defining an E-Commerce Database. Include 3 Entities: "Product" (SKU, Name, Price), "Customer" (Name, Email), and "Order" (Date, Total, Status). Ensure proper IDs and Foreign Keys.
                                        </div>
                                    </div>
                                </details>

                                {/* Prompt 3: Logic Flow */}
                                <details className="group border border-gray-200 rounded-lg overflow-hidden">
                                    <summary className="p-4 bg-gray-50 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">⚡</span>
                                            <span>Generate Business Logic (Actions)</span>
                                        </div>
                                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="p-4 bg-white border-t border-gray-100">
                                        <div className="bg-gray-100 p-3 rounded text-xs font-mono cursor-pointer hover:bg-gray-200 transition" onClick={() => navigator.clipboard.writeText('Generate a ServerAction named "CalculateOrderTotal". Input: OrderId. Logic: Fetch Order items (Aggregate), Loop through them (ForEach), Sum prices (Assign), apply Discount if Total > 1000 (If), and update the Order Record (EntityAction). Output valid XML with Flow and Links.')}>
                                            Generate a ServerAction named "CalculateOrderTotal". Input: OrderId. Logic: Fetch Order items (Aggregate), Loop through them (ForEach), Sum prices (Assign), apply Discount if Total {'>'} 1000 (If), and update the Order Record (EntityAction). Output valid XML with Flow and Links.
                                        </div>
                                    </div>
                                </details>

                                {/* Prompt 4: SQL & JS */}
                                <details className="group border border-gray-200 rounded-lg overflow-hidden">
                                    <summary className="p-4 bg-gray-50 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">💻</span>
                                            <span>Advanced: SQL & JavaScript Nodes</span>
                                        </div>
                                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="p-4 bg-white border-t border-gray-100">
                                        <div className="bg-gray-100 p-3 rounded text-xs font-mono cursor-pointer hover:bg-gray-200 transition" onClick={() => navigator.clipboard.writeText('Generate a ClientAction named "DashboardSetup". It should contain a JavaScript node that initializes a Chart.js library, and a ServerAction call to "GetData". Also generate a ServerAction named "AdvancedSearch" that uses a SQL Node to execute a complex JOIN query on Users and Logs tables. Output XML.')}>
                                            Generate a ClientAction named "DashboardSetup". It should contain a JavaScript node that initializes a Chart.js library, and a ServerAction call to "GetData". Also generate a ServerAction named "AdvancedSearch" that uses a SQL Node to execute a complex JOIN query on Users and Logs tables. Output XML.
                                        </div>
                                    </div>
                                </details>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button onClick={() => setShowPromptsModal(false)} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold shadow-sm">Close Library</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- HELP MODAL: ENTITIES (Simple) --- */}
                {showEntityHelp && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowEntityHelp(false)}>
                        <div className="bg-white p-6 rounded max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-2">Entity Quick Guide</h3>
                            <p className="text-sm text-gray-600 mb-4">Paste this one-liner into ChatGPT:</p>
                            <div className="bg-gray-100 p-3 rounded text-xs font-mono select-all">
                                Generate XML for an OutSystems Entity named "Ticket" with Title, Status, and CreatedBy.
                            </div>
                            <button onClick={() => setShowEntityHelp(false)} className="mt-4 w-full bg-gray-200 py-2 rounded">Close</button>
                        </div>
                    </div>
                )}

                {/* --- HELP MODAL: ACTIONS (Simple) --- */}
                {showActionHelp && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowActionHelp(false)}>
                        <div className="bg-white p-6 rounded max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-2">Action Quick Guide</h3>
                            <p className="text-sm text-gray-600 mb-4">Paste this one-liner into ChatGPT:</p>
                            <div className="bg-gray-100 p-3 rounded text-xs font-mono select-all">
                                Generate XML for a Server Action "Login" that checks username/password using an If node and returns a Boolean.
                            </div>
                            <button onClick={() => setShowActionHelp(false)} className="mt-4 w-full bg-gray-200 py-2 rounded">Close</button>
                        </div>
                    </div>
                )}

                {/* --- MANUAL PASTE MODAL --- */}
                {showPasteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                                <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                                <button onClick={() => processXML(manualPasteContent)} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition">Import Data</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}