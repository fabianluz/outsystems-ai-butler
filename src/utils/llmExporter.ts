import { type Entity, type Module, type LogicAction } from '../db/butlerDB';

export function generateModuleContext(module: Module, entities: Entity[], actions: LogicAction[] = []) {

    const context = {
        context_type: "OutSystems_Module_Definition",
        module_name: module.name,
        layer: module.layer,

        // 1. DATA LAYER
        database: entities.map(ent => ({
            name: ent.name,
            description: ent.description,
            is_public: ent.isPublic,
            columns: ent.attributes.map(a =>
                `${a.name} (${a.dataType})${a.isIdentifier ? ' [PK]' : ''}${a.isMandatory ? ' *' : ''}`
            )
        })),

        // 2. LOGIC LAYER
        logic: actions.map(act => ({
            name: act.name,
            type: act.type,
            description: act.description,
            inputs: act.inputs.map(v => `${v.name} (${v.dataType})`),
            outputs: act.outputs.map(v => `${v.name} (${v.dataType})`),

            // 3. DETAILED LOGIC FLOW
            // The LLM can now read the logic line-by-line
            flow_logic: {
                nodes: act.nodes?.map(n => {
                    // Base Node
                    let details: any = {
                        step: n.label,
                        type: n.type
                    };

                    // ENRICHMENT: Add specific logic details
                    if (n.type === 'If' && n.data?.condition) {
                        details.condition = n.data.condition; // "Amount > 100"
                    }
                    if (n.type === 'Assign' && n.data?.assignments) {
                        details.updates = n.data.assignments.map((a: any) => `${a.variable} = ${a.value}`);
                    }
                    if ((n.type === 'ExecuteServerAction' || n.type === 'RunServerAction') && n.data?.action_name) {
                        details.calls = n.data.action_name;
                    }
                    if (n.type === 'Switch' && n.data?.cases) {
                        details.cases = n.data.cases;
                    }
                    if (n.type === 'Comment') {
                        details.note = n.data?.text;
                    }
                    if (n.type === 'RaiseException') {
                        details.error = `${n.data?.exception}: ${n.data?.message}`;
                    }

                    return details;
                }) || [],

                // Wiring
                connections: act.edges?.map(e => ({
                    from: e.source,
                    to: e.target,
                    trigger: e.label ? e.label : "next"
                })) || []
            }
        }))
    };

    return JSON.stringify(context, null, 2);
}