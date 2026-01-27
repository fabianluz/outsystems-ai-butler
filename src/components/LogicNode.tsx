import { Handle, Position } from '@xyflow/react';

const NODE_STYLES: Record<string, string> = {
    Start: 'bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center',
    End: 'bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center',
    If: 'bg-yellow-100 border-2 border-yellow-400 rotate-45 w-16 h-16',
    Switch: 'bg-yellow-100 border-2 border-yellow-400 w-16 h-16',
    Assign: 'bg-white border border-gray-300 rounded shadow-sm w-32',
    ExecuteServerAction: 'bg-orange-50 border border-orange-300 rounded w-40',
    Default: 'bg-white border border-gray-400 rounded w-32'
};

export default function LogicNode({ data }: { data: { label: string; type: string } }) {
    const styleClass = NODE_STYLES[data.type] || NODE_STYLES.Default;
    const isDiamond = data.type === 'If';

    return (
        <div className={`text-xs text-center flex items-center justify-center relative ${styleClass}`}>
            <div className={isDiamond ? '-rotate-45' : ''}>
                <span className="font-bold">{data.label}</span>
                {data.type === 'ExecuteServerAction' && <div className="text-[8px] text-gray-500">(Action)</div>}
            </div>

            <Handle type="target" position={Position.Top} className="!bg-gray-400 w-2 h-2" />

            {/* If/Switch often have multiple outputs, handled by edges logic, but we provide standard handles */}
            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 w-2 h-2" />
            {isDiamond && <Handle type="source" position={Position.Right} id="false" className="!bg-red-400 w-2 h-2" />}
            {isDiamond && <Handle type="source" position={Position.Left} id="true" className="!bg-green-400 w-2 h-2" />}
        </div>
    );
}