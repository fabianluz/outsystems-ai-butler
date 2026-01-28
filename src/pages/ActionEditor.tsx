import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Node,
    type Edge,
    type Connection,
    type NodeChange,
    type EdgeChange,
    MarkerType,
    StepEdge,
    ReactFlowProvider,
    useReactFlow,
    ConnectionLineType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { db, type LogicAction, type Variable, type DataType } from '../db/butlerDB';
import LogicNode from '../components/LogicNode';

const nodeTypes = { logic: LogicNode };
const edgeTypes = { default: StepEdge };

const DATA_TYPES: DataType[] = ['Text', 'Integer', 'LongInteger', 'Decimal', 'Boolean', 'DateTime', 'Date', 'Identifier', 'Binary', 'Record', 'List'];

// --- TOOLBOX DEFINITIONS ---
const TOOLBOX = {
    Flow: [
        { label: 'Start', type: 'Start', icon: '🟢' },
        { label: 'End', type: 'End', icon: '🔴' },
    ],
    Common: [
        { label: 'Assign', type: 'Assign', icon: '📝' },
        { label: 'If', type: 'If', icon: '🔶' },
        { label: 'Switch', type: 'Switch', icon: '💠' },
        { label: 'Loop', type: 'ForEach', icon: '🔄' },
    ],
    Data: [
        { label: 'Aggregate', type: 'Aggregate', icon: '📊' },
        { label: 'SQL', type: 'SQL', icon: '💾' },
        { label: 'Entity Action', type: 'EntityAction', icon: '📦' },
    ],
    Logic: [
        { label: 'Run Server Action', type: 'ExecuteServerAction', icon: '⚡' },
        { label: 'Run Client Action', type: 'RunClientAction', icon: '📱' },
        { label: 'Raise Exception', type: 'RaiseException', icon: '⚠️' },
        { label: 'Comment', type: 'Comment', icon: '💬' },
    ],
    End: [
        { label: 'Destination', type: 'Destination', icon: '➜' },
        { label: 'Download', type: 'Download', icon: '⬇️' },
    ]
};

// --- LAYOUT ENGINE ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
        g.setNode(node.id, { width: 100, height: 60 });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return {
        nodes: nodes.map((node) => {
            const pos = g.node(node.id);
            return {
                ...node,
                position: {
                    x: pos.x - 50,
                    y: pos.y - 30
                }
            };
        }),
        edges
    };
};

function ActionEditorContent() {
    const { moduleId, actionId } = useParams();
    const navigate = useNavigate();
    const isNew = actionId === 'new';

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    // State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'Server' | 'Service' | 'Client'>('Server');
    const [isPublic, setIsPublic] = useState(false);
    const [inputs, setInputs] = useState<Variable[]>([]);
    const [outputs, setOutputs] = useState<Variable[]>([]);
    const [showHelp, setShowHelp] = useState(false); // Help Modal State

    const [nodes, setNodes] = useNodesState<Node>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);
    const [selectedElement, setSelectedElement] = useState<{ id: string, type: 'node' | 'edge' } | null>(null);

    // Initial Load
    useEffect(() => {
        if (!isNew && actionId) {
            db.actions.get(actionId).then((act) => {
                if (act) {
                    setName(act.name);
                    setDescription(act.description);
                    setType(act.type);
                    setIsPublic(act.isPublic);
                    setInputs(act.inputs);
                    setOutputs(act.outputs);

                    if (act.nodes && act.edges) {
                        let flowNodes: Node[] = act.nodes.map(n => ({
                            id: n.id,
                            type: 'logic',
                            position: { x: n.posX, y: n.posY },
                            data: { label: n.label, type: n.type, ...n.data }
                        }));

                        const flowEdges: Edge[] = act.edges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target,
                            label: e.label,
                            type: 'step',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: { stroke: '#94a3b8', strokeWidth: 1.5 }
                        }));

                        if (flowNodes.length > 0 && flowNodes[0].position.x === 0) {
                            const layout = getLayoutedElements(flowNodes, flowEdges);
                            flowNodes = layout.nodes;
                        }

                        setNodes(flowNodes);
                        setEdges(flowEdges);
                    }
                }
            });
        }
    }, [actionId, isNew, setNodes, setEdges]);

    // Handlers
    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
        ...params,
        type: 'step',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5, stroke: '#94a3b8' }
    }, eds)), [setEdges]);

    const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedElement({ id: node.id, type: 'node' });
    const onEdgeClick = (_: React.MouseEvent, edge: Edge) => setSelectedElement({ id: edge.id, type: 'edge' });
    const onPaneClick = () => setSelectedElement(null);

    // Drag Handlers
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const id = uuidv4();
            let defaultData: any = { label: type, type: type };

            // Defaults
            if (type === 'If') defaultData.condition = 'True';
            if (type === 'Switch') defaultData.variable = 'Var1';
            if (type === 'Assign') defaultData.assignments = [];
            if (type === 'JavaScript') defaultData.code = '// Write JS here';
            if (type === 'SQL') defaultData.query = 'SELECT * FROM {Entity}';

            const newNode: Node = { id, type: 'logic', position, data: defaultData };
            setNodes((nds) => nds.concat(newNode));
            setSelectedElement({ id, type: 'node' });
        },
        [screenToFlowPosition, setNodes],
    );

    const handleSave = async () => {
        if (!name || !moduleId) return;
        const dbNodes = nodes.map(n => ({
            id: n.id, type: n.data.type as string, label: n.data.label as string, posX: n.position.x, posY: n.position.y, data: n.data
        }));
        const dbEdges = edges.map(e => ({
            id: e.id, source: e.source, target: e.target, label: e.label as string
        }));
        const actionData: LogicAction = {
            id: isNew ? uuidv4() : actionId!, moduleId, name, description, type, isPublic, isFunction: false, inputs, outputs,
            flowSummary: `Visual Flow with ${dbNodes.length} nodes`, nodes: dbNodes, edges: dbEdges
        };
        await db.actions.put(actionData);
        navigate(-1);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

            {/* HEADER */}
            <div className="bg-white border-b border-gray-300 h-12 flex justify-between items-center px-4 shrink-0 shadow-sm z-50 relative">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-black font-bold">←</button>
                    <input value={name} onChange={e => setName(e.target.value)} className="font-bold text-gray-800 outline-none placeholder-gray-300" placeholder="Action Name" />
                    <span className="text-xs text-gray-400 border px-1 rounded">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-blue-600 px-2 py-1 rounded transition" title="Editor Help">
                        ❓
                    </button>
                    <button onClick={handleSave} className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded hover:bg-blue-700 font-bold">Save</button>
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">

                {/* LEFT TOOLBOX */}
                <div className="w-14 hover:w-48 transition-all duration-300 bg-gray-100 border-r border-gray-300 flex flex-col z-20 group overflow-hidden shadow-lg">
                    <div className="p-2 border-b border-gray-200 bg-gray-200 font-bold text-[10px] text-gray-600 uppercase tracking-wider text-center group-hover:text-left group-hover:pl-4">
                        <span className="hidden group-hover:inline">Toolbox</span>
                        <span className="group-hover:hidden">🛠️</span>
                    </div>

                    <div className="overflow-y-auto flex-grow select-none">
                        {Object.entries(TOOLBOX).map(([cat, items]) => (
                            <div key={cat} className="border-b border-gray-200">
                                <div className="hidden group-hover:block px-4 py-1 text-[10px] font-bold text-gray-400 uppercase bg-gray-50">{cat}</div>
                                {items.map(item => (
                                    <div
                                        key={item.type}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-white transition text-left relative cursor-grab active:cursor-grabbing"
                                        title={item.label}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item.type)}
                                    >
                                        <span className="text-lg w-6 text-center pointer-events-none">{item.icon}</span>
                                        <span className="text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER CANVAS */}
                <div className="flex-grow bg-[#f0f2f5] relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
                        onDrop={onDrop} onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionLineType={ConnectionLineType.Step}
                        fitView
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls />
                    </ReactFlow>
                </div>

                {/* RIGHT PROPERTIES PANEL */}
                <div className="w-72 bg-white border-l border-gray-300 flex flex-col z-20 shadow-lg">
                    {selectedElement ? (
                        <>
                            <div className="p-2 bg-gray-100 border-b font-bold text-xs text-gray-600 flex justify-between items-center">
                                <span>Properties</span>
                                <button
                                    onClick={() => {
                                        if (selectedElement.type === 'node') setNodes(nds => nds.filter(n => n.id !== selectedElement.id));
                                        else setEdges(eds => eds.filter(e => e.id !== selectedElement.id));
                                        setSelectedElement(null);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete Element"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto flex-grow">
                                <NodePropertiesInspector
                                    selectedId={selectedElement.id}
                                    type={selectedElement.type}
                                    nodes={nodes}
                                    setNodes={setNodes}
                                    edges={edges}
                                    setEdges={setEdges}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-gray-100 border-b font-bold text-xs text-gray-600">Action Signature</div>
                            <div className="p-4 overflow-y-auto flex-grow space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded text-xs h-20 outline-none resize-none" placeholder="Describe logic..." />
                                </div>
                                <VariableList title="Input Parameters" vars={inputs} setVars={setInputs} />
                                <div className="border-t pt-4"><VariableList title="Output Parameters" vars={outputs} setVars={setOutputs} /></div>
                                <div className="border-t pt-4">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                                        Public
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* HELP MODAL */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowHelp(false)}>
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-4 text-blue-900 border-b pb-2">Editor Guide</h3>

                            <div className="space-y-4 text-sm text-gray-600">
                                <div>
                                    <strong className="block text-black mb-1">🖱️ Drag & Drop</strong>
                                    <p>Drag nodes from the <b>Toolbox (Left)</b> directly onto the canvas to place them.</p>
                                </div>
                                <div>
                                    <strong className="block text-black mb-1">🔗 Connecting Nodes</strong>
                                    <p>Click and drag from the <b>Bottom Handle</b> of a node to the <b>Top Handle</b> of another.</p>
                                </div>
                                <div>
                                    <strong className="block text-black mb-1">⚙️ Properties</strong>
                                    <p>Click any Node or Line to edit its details in the <b>Right Panel</b> (e.g., SQL queries, IF conditions).</p>
                                </div>
                                <div>
                                    <strong className="block text-black mb-1">⌨️ Shortcuts</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li><b>Backspace / Delete:</b> Remove selected node/edge.</li>
                                        <li><b>Scroll Wheel:</b> Zoom in/out.</li>
                                        <li><b>Drag Canvas:</b> Pan around.</li>
                                    </ul>
                                </div>
                            </div>

                            <button onClick={() => setShowHelp(false)} className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                                Got it
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// --- MAIN WRAPPER ---
export default function ActionEditor() {
    return (
        <ReactFlowProvider>
            <ActionEditorContent />
        </ReactFlowProvider>
    );
}

// --- SUB-COMPONENTS ---

function NodePropertiesInspector({ selectedId, type, nodes, setNodes, edges, setEdges }: any) {
    if (type === 'edge') {
        const edge = edges.find((e: Edge) => e.id === selectedId);
        if (!edge) return null;

        const updateLabel = (l: string) => setEdges((eds: Edge[]) => eds.map((e) => e.id === selectedId ? { ...e, label: l } : e));

        return (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800">Connector</h3>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Label</label>
                    <input value={edge.label || ''} onChange={e => updateLabel(e.target.value)} className="w-full border p-2 rounded text-xs" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => updateLabel('True')} className="flex-1 bg-green-50 border text-green-700 text-xs py-1 rounded">True</button>
                    <button onClick={() => updateLabel('False')} className="flex-1 bg-red-50 border text-red-700 text-xs py-1 rounded">False</button>
                </div>
            </div>
        );
    }

    const node = nodes.find((n: Node) => n.id === selectedId);
    if (!node) return null;
    const t = node.data.type as string;

    const updateData = (key: string, val: any) => {
        setNodes((nds: Node[]) => nds.map((n) => n.id === selectedId ? { ...n, data: { ...n.data, [key]: val } } : n));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 mb-2">{t} Node</h3>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Label</label>
                <input value={node.data.label as string} onChange={e => updateData('label', e.target.value)} className="w-full border p-2 rounded text-xs font-semibold" />
            </div>

            {t === 'If' && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Condition</label>
                    <textarea value={node.data.condition as string || ''} onChange={e => updateData('condition', e.target.value)} className="w-full border p-2 rounded text-xs h-20 bg-yellow-50 font-mono" />
                </div>
            )}

            {t === 'SQL' && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">SQL Query</label>
                    <textarea
                        value={node.data.query as string || ''}
                        onChange={e => updateData('query', e.target.value)}
                        className="w-full border p-2 rounded text-xs h-40 bg-gray-900 text-green-400 font-mono resize-y"
                        placeholder="SELECT * FROM Entity..."
                    />
                </div>
            )}

            {t === 'JavaScript' && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">JavaScript Code</label>
                    <textarea
                        value={node.data.code as string || ''}
                        onChange={e => updateData('code', e.target.value)}
                        className="w-full border p-2 rounded text-xs h-40 bg-yellow-50 text-gray-800 font-mono resize-y"
                    />
                </div>
            )}

            {t === 'Assign' && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Assignments</label>
                    <div className="space-y-1">
                        {/* @ts-ignore */}
                        {(node.data.assignments || []).map((a: any, i: number) => (
                            <div key={i} className="flex gap-1 text-xs">
                                <input value={a.variable} onChange={e => { const newA = [...node.data.assignments as any]; newA[i].variable = e.target.value; updateData('assignments', newA); }} className="w-1/2 border p-1 rounded" placeholder="Var" />
                                <span className="pt-1">=</span>
                                <input value={a.value} onChange={e => { const newA = [...node.data.assignments as any]; newA[i].value = e.target.value; updateData('assignments', newA); }} className="w-1/2 border p-1 rounded" placeholder="Val" />
                            </div>
                        ))}
                        <button onClick={() => updateData('assignments', [...(node.data.assignments as any || []), { variable: '', value: '' }])} className="text-blue-600 text-xs hover:underline">+ Add Assignment</button>
                    </div>
                </div>
            )}

            {(t === 'ExecuteServerAction' || t === 'RunClientAction') && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Action</label>
                    <input value={node.data.action_name as string || ''} onChange={e => updateData('action_name', e.target.value)} className="w-full border p-2 rounded text-xs" placeholder="Search Action..." />
                </div>
            )}
        </div>
    );
}

function VariableList({ title, vars, setVars }: { title: string, vars: Variable[], setVars: React.Dispatch<React.SetStateAction<Variable[]>> }) {
    const add = () => setVars(prev => [...prev, { id: uuidv4(), name: 'NewVar', dataType: 'Text', isList: false, isMandatory: false }]);
    const update = (id: string, field: string, val: any) => setVars(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
    const remove = (id: string) => setVars(prev => prev.filter(v => v.id !== id));

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">{title}</span>
                <button onClick={add} className="text-blue-600 text-xs hover:underline">+ Add</button>
            </div>
            <div className="space-y-1">
                {vars.map(v => (
                    <div key={v.id} className="flex gap-1 items-center">
                        <input value={v.name} onChange={e => update(v.id, 'name', e.target.value)} className="flex-grow border p-1 rounded text-xs" />
                        <select value={v.dataType} onChange={e => update(v.id, 'dataType', e.target.value)} className="w-20 border p-1 rounded text-[10px]">
                            {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => remove(v.id)} className="text-red-400 hover:text-red-600 text-xs px-1">×</button>
                    </div>
                ))}
            </div>
        </div>
    );
}