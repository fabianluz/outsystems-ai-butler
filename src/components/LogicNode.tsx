import { Handle, Position, type NodeProps } from '@xyflow/react';

// --- ICONS (Mini SVGs to mimic Service Studio) ---
const Icons = {
    Start: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M8 5v14l11-7z" /></svg>,
    End: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
    Assign: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-blue-600"><path d="M5 9h14M5 15h14" /></svg>,
    If: <span className="text-yellow-700 font-bold text-xs">?</span>,
    Switch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-cyan-700"><path d="M6 3v18M18 3v18M3 12h18" /></svg>,
    Loop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-700"><path d="M4 12v-3a3 3 0 0 1 3-3h13m-3-3l3 3l-3 3" /><path d="M20 12v3a3 3 0 0 1-3 3H4m3 3l-3-3l3-3" /></svg>,
    Action: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-orange-600"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    Aggregate: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-purple-700"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
    SQL: <span className="font-bold text-[10px] text-gray-200">SQL</span>,
    JS: <span className="font-bold text-[10px] text-yellow-500">JS</span>,
    Msg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
    Comment: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-600"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></svg>,
    Download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    Exception: <span className="font-bold text-lg text-red-600">!</span>,
    Dest: <span className="font-bold text-white text-xs">➜</span>
};

// --- STYLE MAPPING ---
export default function LogicNode({ data, selected }: NodeProps) {
    const type = (data.type as string) || 'Default';
    const label = (data.label as string) || '';
    
    // Selection Ring
    const sel = selected ? 'ring-2 ring-blue-500 ring-offset-1 z-50' : '';

    // Render based on Type
    if (type === 'Start') {
        return (
            <div className={`w-8 h-8 bg-green-500 rounded-full border-2 border-green-600 flex items-center justify-center shadow-sm hover:scale-110 transition ${sel}`}>
                {Icons.Start}
                <Handle type="source" position={Position.Bottom} className="opacity-0" />
            </div>
        );
    }

    if (type === 'End') {
        return (
            <div className={`w-8 h-8 bg-red-500 rounded-full border-2 border-red-600 flex items-center justify-center shadow-sm hover:scale-110 transition ${sel}`}>
                {Icons.End}
                <Handle type="target" position={Position.Top} className="opacity-0" />
            </div>
        );
    }

    if (type === 'If') {
        return (
            <div className={`w-10 h-10 bg-yellow-50 border-2 border-yellow-400 rotate-45 flex items-center justify-center shadow-sm ${sel}`}>
                <div className="-rotate-45">{Icons.If}</div>
                <Handle type="target" position={Position.Top} className="opacity-0" />
                <Handle type="source" position={Position.Left} id="True" className="opacity-0" />
                <Handle type="source" position={Position.Right} id="False" className="opacity-0" />
            </div>
        );
    }

    if (type === 'Switch') {
        return (
            <div className={`w-10 h-10 bg-cyan-50 border-2 border-cyan-500 rotate-45 flex items-center justify-center shadow-sm ${sel}`}>
                <div className="-rotate-45">{Icons.Switch}</div>
                <Handle type="target" position={Position.Top} className="opacity-0" />
                <Handle type="source" position={Position.Bottom} className="opacity-0" />
            </div>
        );
    }

    // Standard Rectangular Nodes (Assign, Action, etc.)
    let icon = null;
    let colorClass = 'bg-white border-gray-300';
    
    switch(type) {
        case 'Assign': icon = Icons.Assign; break;
        case 'ForEach': icon = Icons.Loop; colorClass = 'bg-blue-50 border-blue-400'; break;
        case 'ExecuteServerAction': 
        case 'RunServerAction':
        case 'RunClientAction': icon = Icons.Action; colorClass = 'bg-orange-50 border-orange-300'; break;
        case 'Aggregate': icon = Icons.Aggregate; colorClass = 'bg-purple-50 border-purple-300'; break;
        case 'SQL': icon = Icons.SQL; colorClass = 'bg-gray-700 border-gray-900'; break;
        case 'JavaScript': icon = Icons.JS; colorClass = 'bg-yellow-50 border-yellow-400'; break;
        case 'Message': icon = Icons.Msg; colorClass = 'bg-blue-50 border-blue-300'; break;
        case 'RaiseException': icon = Icons.Exception; colorClass = 'bg-red-50 border-red-300'; break;
        case 'Comment': icon = Icons.Comment; colorClass = 'bg-yellow-100 border-yellow-200'; break;
        case 'Download': return <div className={`w-8 h-8 bg-purple-600 rounded-full border-2 border-purple-800 flex items-center justify-center ${sel}`}>{Icons.Download}<Handle type="target" position={Position.Top} className="opacity-0" /></div>;
        case 'Destination': return <div className={`w-8 h-8 bg-blue-600 rounded-full border-2 border-blue-800 flex items-center justify-center ${sel}`}>{Icons.Dest}<Handle type="target" position={Position.Top} className="opacity-0" /></div>;
    }

    return (
        <div className={`relative min-w-[80px] px-2 py-1 rounded shadow-sm border flex flex-col items-center justify-center ${colorClass} ${sel}`}>
            <div className="mb-0.5">{icon}</div>
            <span className="text-[9px] font-semibold text-center leading-tight truncate w-full block text-gray-700">
                {label || type}
            </span>
            {/* Handles */}
            <Handle type="target" position={Position.Top} className="w-1 h-1 !bg-gray-400 !border-none" />
            <Handle type="source" position={Position.Bottom} className="w-1 h-1 !bg-gray-400 !border-none" />
            {type === 'ForEach' && <Handle type="source" position={Position.Right} id="Cycle" className="w-1 h-1 !bg-blue-500 !border-none" />}
        </div>
    );
}