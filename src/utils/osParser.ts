import { XMLParser } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';
import { type Entity, type LogicAction, type FlowNode, type FlowEdge, type DataType, type Variable } from '../db/butlerDB';

// 1. Setup Parser
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name) => {
        // Treat these as arrays even if single
        return ["Entity", "EntityAttribute", "ServerAction", "ClientAction", "ServiceAction", "InputParameter", "OutputParameter", "Variable", "Link"].includes(name);
    }
});

const mapOsTypeToLocal = (osType: string): DataType => {
    if (!osType) return 'Text';
    const lower = osType.toLowerCase();
    if (lower.includes('text') || lower.includes('phone') || lower.includes('email')) return 'Text';
    if (lower.includes('longinteger')) return 'LongInteger';
    if (lower.includes('integer')) return 'Integer';
    if (lower.includes('decimal') || lower.includes('currency')) return 'Decimal';
    if (lower.includes('boolean')) return 'Boolean';
    if (lower.includes('datetime')) return 'DateTime';
    if (lower.includes('date')) return 'Date';
    if (lower.includes('binary')) return 'Binary';
    return 'Text';
};

// --- PARSING LOGIC ---

export const parseClipboardData = (xmlString: string, moduleId: string): { entities: Entity[], actions: LogicAction[] } => {
    const resultEntities: Entity[] = [];
    const resultActions: LogicAction[] = [];

    try {
        const jsonObj = parser.parse(xmlString);

        // Helper to traverse and find specific tags
        const findObjects = (obj: any, tagNames: string[]): any[] => {
            let found: any[] = [];
            if (!obj) return found;

            if (Array.isArray(obj)) {
                obj.forEach(item => found = found.concat(findObjects(item, tagNames)));
            } else if (typeof obj === 'object') {
                // Check if this object IS one of the tags
                tagNames.forEach(tag => {
                    if (obj[tag]) found = found.concat(obj[tag]);
                });

                // Dig deeper
                Object.keys(obj).forEach(key => {
                    if (!tagNames.includes(key)) {
                        found = found.concat(findObjects(obj[key], tagNames));
                    }
                });
            }
            return found;
        };

        // 1. Parse Entities
        const rawEntities = findObjects(jsonObj, ['Entity']);
        rawEntities.forEach((raw: any) => {
            const newEntity: Entity = {
                id: uuidv4(),
                moduleId: moduleId,
                name: raw.Name || 'Unknown',
                description: raw.Description || '',
                isStatic: raw.IsStatic === 'true',
                isPublic: raw.IsPublic === 'true',
                attributes: []
            };
            if (raw.Attributes && raw.Attributes.EntityAttribute) {
                raw.Attributes.EntityAttribute.forEach((attr: any) => {
                    newEntity.attributes.push({
                        id: uuidv4(),
                        name: attr.Name,
                        dataType: mapOsTypeToLocal(attr.Type),
                        length: attr.Length ? parseInt(attr.Length) : undefined,
                        isMandatory: attr.IsMandatory === 'true',
                        isIdentifier: attr.IsIdentifier === 'true'
                    });
                });
            }
            resultEntities.push(newEntity);
        });

        // 2. Parse Actions
        const rawActions = findObjects(jsonObj, ['ServerAction', 'ClientAction', 'ServiceAction']);

        rawActions.forEach((raw: any) => {
            const actionId = uuidv4();
            const nodes: FlowNode[] = [];
            const edges: FlowEdge[] = [];

            // A. Parse Variables (Inputs/Outputs)
            const inputs: Variable[] = [];
            const outputs: Variable[] = [];

            if (raw.Parameters) {
                const params = Array.isArray(raw.Parameters) ? raw.Parameters : [raw.Parameters]; // Safety check
                // XMLParser usually puts InputParameter inside Parameters object, let's look closer
                // Often structure is: Parameters -> InputParameter: [...]
            }
            // (Simplified: iterate known keys)
            if (raw.InputParameter) raw.InputParameter.forEach((p: any) => inputs.push(mapVar(p)));
            if (raw.OutputParameter) raw.OutputParameter.forEach((p: any) => outputs.push(mapVar(p)));

            // B. Parse Flow Nodes & Edges
            // OutSystems XML puts flow objects as children of the Action (e.g. <Start>, <Assign>)
            // It also has a <Link> tag for connections.

            // We scan for known Flow Nodes
            const flowTags = ['Start', 'End', 'Assign', 'If', 'Switch', 'ExecuteServerAction', 'RunServerAction', 'Aggregate', 'SQL', 'ForEach', 'Comment'];

            flowTags.forEach(tag => {
                if (raw[tag]) {
                    const items = Array.isArray(raw[tag]) ? raw[tag] : [raw[tag]];
                    items.forEach((item: any) => {
                        nodes.push({
                            id: item.Name, // OS uses Name as ID in Links
                            type: tag,
                            label: item.Name || tag,
                            posX: 0, // OS XML doesn't always give X/Y clearly, Layout engine will fix
                            posY: 0
                        });
                    });
                }
            });

            // C. Parse Links (Edges)
            if (raw.Link) {
                raw.Link.forEach((link: any) => {
                    edges.push({
                        id: uuidv4(),
                        source: link.Source,
                        target: link.Target,
                        label: link.Label || ''
                    });
                });
            }

            resultActions.push({
                id: actionId,
                moduleId,
                name: raw.Name || 'NewAction',
                type: raw.OriginalName ? 'Client' : 'Server', // Heuristic
                description: raw.Description || '',
                isFunction: raw.IsFunction === 'true',
                isPublic: raw.IsPublic === 'true',
                inputs,
                outputs,
                flowSummary: `Imported logic with ${nodes.length} nodes.`,
                nodes,
                edges
            });
        });

    } catch (error) {
        console.error("XML Parse Error:", error);
        throw new Error("Could not parse XML.");
    }

    return { entities: resultEntities, actions: resultActions };
};

const mapVar = (raw: any): Variable => ({
    id: uuidv4(),
    name: raw.Name,
    dataType: mapOsTypeToLocal(raw.Type),
    isList: false,
    isMandatory: raw.IsMandatory === 'true'
});