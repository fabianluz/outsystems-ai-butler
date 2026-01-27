import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db, type LogicAction, type Variable, type DataType } from '../db/butlerDB';

const DATA_TYPES: DataType[] = ['Text', 'Integer', 'LongInteger', 'Decimal', 'Boolean', 'DateTime', 'Date', 'Identifier', 'Binary', 'Record', 'List'];

export default function ActionEditor() {
    const { moduleId, actionId } = useParams();
    const navigate = useNavigate();
    const isNew = actionId === 'new';

    // Core State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'Server' | 'Service' | 'Client'>('Server');
    const [isPublic, setIsPublic] = useState(false);
    const [isFunction, setIsFunction] = useState(false);
    const [flowSummary, setFlowSummary] = useState('');

    // Lists State
    const [inputs, setInputs] = useState<Variable[]>([]);
    const [outputs, setOutputs] = useState<Variable[]>([]);
    // Keep existing visual data if editing
    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);

    // Load Data
    useEffect(() => {
        if (!isNew && actionId) {
            db.actions.get(actionId).then((act) => {
                if (act) {
                    setName(act.name);
                    setDescription(act.description);
                    setType(act.type);
                    setIsPublic(act.isPublic);
                    setIsFunction(act.isFunction);
                    setFlowSummary(act.flowSummary);
                    setInputs(act.inputs);
                    setOutputs(act.outputs);
                    setNodes(act.nodes || []);
                    setEdges(act.edges || []);
                }
            });
        }
    }, [actionId, isNew]);

    // Helper for List Management
    const addVariable = (listSetter: React.Dispatch<React.SetStateAction<Variable[]>>) => {
        listSetter(prev => [...prev, {
            id: uuidv4(), name: '', dataType: 'Text', isList: false, isMandatory: false
        }]);
    };

    const updateVariable = (
        list: Variable[],
        setter: React.Dispatch<React.SetStateAction<Variable[]>>,
        id: string,
        field: keyof Variable,
        value: any
    ) => {
        setter(list.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const removeVariable = (
        list: Variable[],
        setter: React.Dispatch<React.SetStateAction<Variable[]>>,
        id: string
    ) => {
        setter(list.filter(v => v.id !== id));
    };

    const handleSave = async () => {
        if (!name || !moduleId) return;
        const actionData: LogicAction = {
            id: isNew ? uuidv4() : actionId!,
            moduleId, name, description, type, isPublic, isFunction,
            inputs, outputs, flowSummary,
            nodes, // Preserve existing diagrams
            edges
        };
        await db.actions.put(actionData);
        navigate(-1);
    };

    // Reusable Variable Row Component
    const VariableRow = ({
        vars, setVars, title
    }: { vars: Variable[], setVars: any, title: string }) => (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
                <button onClick={() => addVariable(setVars)} className="text-blue-600 text-xs font-bold hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
                {vars.map(v => (
                    <div key={v.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                        <input
                            placeholder="Name"
                            value={v.name}
                            onChange={e => updateVariable(vars, setVars, v.id, 'name', e.target.value)}
                            className="flex-grow bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm"
                        />
                        <select
                            value={v.dataType}
                            onChange={e => updateVariable(vars, setVars, v.id, 'dataType', e.target.value)}
                            className="bg-transparent text-xs text-gray-600 outline-none w-24"
                        >
                            {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input type="checkbox" checked={v.isList} onChange={e => updateVariable(vars, setVars, v.id, 'isList', e.target.checked)} />
                            List
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input type="checkbox" checked={v.isMandatory} onChange={e => updateVariable(vars, setVars, v.id, 'isMandatory', e.target.checked)} />
                            Mandatory
                        </label>
                        <button onClick={() => removeVariable(vars, setVars, v.id)} className="text-red-300 hover:text-red-500 px-2">×</button>
                    </div>
                ))}
                {vars.length === 0 && <p className="text-xs text-gray-400 italic">No variables defined.</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg flex flex-col h-[90vh]">

                {/* Header */}
                <div className="bg-gray-800 text-white p-6 flex justify-between items-center shrink-0 rounded-t-xl">
                    <h1 className="text-2xl font-bold">{isNew ? 'New Logic Action' : `Edit ${name}`}</h1>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold transition">Save Logic</button>
                    </div>
                </div>

                <div className="flex flex-grow overflow-hidden">

                    {/* Left Column: Properties */}
                    <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Name</label>
                            <input
                                value={name} onChange={e => setName(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none"
                                placeholder="Action Name" autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border p-2 rounded text-sm">
                                    <option value="Server">Server Action</option>
                                    <option value="Service">Service Action</option>
                                    <option value="Client">Client Action</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2 pt-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-blue-600" /> Public
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={isFunction} onChange={e => setIsFunction(e.target.checked)} className="accent-blue-600" /> Function
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Description (The "Intent")</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none h-24 text-sm"
                                placeholder="What does this action do? (Crucial for LLM)"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Flow Summary</label>
                            <textarea
                                value={flowSummary} onChange={e => setFlowSummary(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none h-32 text-sm font-mono text-gray-600"
                                placeholder="1. GetUser&#10;2. Validate&#10;3. Update"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Briefly list the major steps.</p>
                        </div>
                    </div>

                    {/* Right Column: Signature */}
                    <div className="w-2/3 p-8 overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Signature</h2>
                        <VariableRow vars={inputs} setVars={setInputs} title="Input Parameters" />
                        <div className="border-t border-gray-100 my-6"></div>
                        <VariableRow vars={outputs} setVars={setOutputs} title="Output Parameters" />
                    </div>

                </div>
            </div>
        </div>
    );
}