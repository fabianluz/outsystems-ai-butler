import { Handle, Position } from '@xyflow/react';
import { type Attribute } from '../db/butlerDB';

export default function EntityNode({ data }: { data: { label: string; attributes: Attribute[] } }) {
    return (
        // FIX: Changed min-w-[200px] to fixed w-64 (256px) so layout calculation is always accurate
        <div className="w-64 bg-white border-2 border-gray-800 rounded-md shadow-lg overflow-hidden flex flex-col">
            {/* 1. Header */}
            <div className="bg-gray-800 text-white px-3 py-2 font-bold text-sm text-center truncate" title={data.label}>
                {data.label}
            </div>

            {/* 2. Attributes List */}
            <div className="p-2 bg-gray-50 flex-grow">
                {data.attributes.map((attr) => (
                    <div key={attr.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {/* Icons */}
                            <div className="flex-shrink-0 flex gap-1">
                                {attr.isIdentifier && <span className="text-[8px] bg-red-500 text-white px-1 rounded">PK</span>}
                                {!attr.isIdentifier && attr.name.endsWith('Id') && <span className="text-[8px] bg-gray-400 text-white px-1 rounded">FK</span>}
                            </div>
                            {/* Name (Truncated) */}
                            <span className={`truncate ${attr.isIdentifier ? 'font-bold text-gray-800' : 'text-gray-600'}`} title={attr.name}>
                                {attr.name}
                            </span>
                        </div>
                        {/* Type (Truncated) */}
                        <span className="text-gray-400 italic text-[10px] flex-shrink-0 ml-2">{attr.dataType}</span>
                    </div>
                ))}
            </div>

            {/* 3. Handles */}
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-800" />
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-800" />
        </div>
    );
}