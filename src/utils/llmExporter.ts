import { type Entity, type Module, type LogicAction } from '../db/butlerDB';

export function generateModuleContext(module: Module, entities: Entity[], actions: LogicAction[] = []) { // Add actions param

    const context = {
        context_type: "OutSystems_Module_Definition",
        module_name: module.name,
        layer: module.layer,

        // DATA LAYER
        database: entities.map(ent => ({
            name: ent.name,
            description: ent.description,
            columns: ent.attributes.map(a => `${a.name} (${a.dataType})`)
        })),

        // LOGIC LAYER
        logic: actions.map(act => ({
            name: act.name,
            type: act.type,
            description: act.description,
            inputs: act.inputs.map(v => `${v.name} (${v.dataType})`),
            outputs: act.outputs.map(v => `${v.name} (${v.dataType})`),
            flow_summary: act.flowSummary // The LLM loves this summary!
        }))
    };

    return JSON.stringify(context, null, 2);
}