import { type Entity, type LogicAction, type FlowNode, type FlowEdge, type Attribute, type Variable } from '../db/butlerDB';

// Helper to escape special XML characters
const escape = (str: string | undefined) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

export const generateOSXML = (entities: Entity[], actions: LogicAction[]): string => {

    let xml = `<ClipboardData>\n`;

    // 1. EXPORT ENTITIES
    entities.forEach(ent => {
        xml += `  <Entity Name="${escape(ent.name)}" Description="${escape(ent.description)}" IsPublic="${ent.isPublic}" IsStatic="${ent.isStatic}">\n`;
        xml += `    <Attributes>\n`;
        ent.attributes.forEach(attr => {
            let attrXml = `      <EntityAttribute Name="${escape(attr.name)}" Type="${attr.dataType}" IsMandatory="${attr.isMandatory}" IsIdentifier="${attr.isIdentifier}"`;
            if (attr.dataType === 'Text' && attr.length) attrXml += ` Length="${attr.length}"`;
            attrXml += ` />\n`;
            xml += attrXml;
        });
        xml += `    </Attributes>\n`;
        xml += `  </Entity>\n`;
    });

    // 2. EXPORT ACTIONS
    actions.forEach(act => {
        const tag = act.type === 'Client' ? 'ClientAction' : (act.type === 'Service' ? 'ServiceAction' : 'ServerAction');

        xml += `  <${tag} Name="${escape(act.name)}" Description="${escape(act.description)}" IsPublic="${act.isPublic}" IsFunction="${act.isFunction}">\n`;

        // Parameters
        act.inputs.forEach(p => {
            xml += `    <InputParameter Name="${escape(p.name)}" Type="${p.dataType}" IsMandatory="${p.isMandatory}" />\n`;
        });
        act.outputs.forEach(p => {
            xml += `    <OutputParameter Name="${escape(p.name)}" Type="${p.dataType}" />\n`;
        });

        // Flow Container
        xml += `    <Flow>\n`;

        // Nodes
        if (act.nodes) {
            act.nodes.forEach(node => {
                xml += generateNodeXML(node);
            });
        }

        // Links (Edges)
        if (act.edges) {
            act.edges.forEach(edge => {
                xml += `      <Link Source="${escape(edge.source)}" Target="${escape(edge.target)}" Label="${escape(edge.label || '')}" />\n`;
            });
        }

        xml += `    </Flow>\n`;
        xml += `  </${tag}>\n`;
    });

    xml += `</ClipboardData>`;
    return xml;
};

// Helper to generate specific XML for different node types
const generateNodeXML = (node: FlowNode): string => {
    const name = escape(node.label || node.type);
    const type = node.type;
    const d = node.data || {};

    let inner = '';

    switch (type) {
        case 'Start': return `      <Start Name="${name}" />\n`;
        case 'End': return `      <End Name="${name}" />\n`;

        case 'Assign':
            if (d.assignments) {
                // @ts-ignore
                d.assignments.forEach(a => {
                    inner += `        <Assignment Variable="${escape(a.variable)}" Value="${escape(a.value)}" />\n`;
                });
            }
            return `      <Assign Name="${name}">\n${inner}      </Assign>\n`;

        case 'If':
            return `      <If Name="${name}">\n        <Condition>${escape(d.condition)}</Condition>\n      </If>\n`;

        case 'Switch':
            if (d.cases) {
                // @ts-ignore
                d.cases.forEach(c => {
                    inner += `        <Case Condition="${escape(c)}" />\n`;
                });
            }
            return `      <Switch Name="${name}" Variable="${escape(d.variable)}">\n${inner}      </Switch>\n`;

        case 'ExecuteServerAction':
        case 'RunServerAction':
        case 'RunClientAction':
            return `      <ExecuteServerAction Name="${name}">\n        <Action Name="${escape(d.action_name)}" />\n      </ExecuteServerAction>\n`;

        case 'Aggregate':
            return `      <Aggregate Name="${name}" />\n`;

        case 'SQL':
            return `      <SQL Name="${name}" SQL="${escape(d.query)}" />\n`;

        case 'JavaScript':
            return `      <JavaScript Name="${name}" Code="${escape(d.code)}" />\n`;

        case 'Comment':
            return `      <Comment Name="${name}" Text="${escape(d.text)}" />\n`;

        case 'ForEach':
            return `      <ForEach Name="${name}" RecordList="${escape(d.list)}" />\n`;

        case 'RaiseException':
            return `      <RaiseException Name="${name}" Exception="${escape(d.exception)}" ExceptionMessage="${escape(d.message)}" />\n`;

        case 'Message':
            return `      <Message Name="${name}" Message="${escape(d.message)}" Type="${d.msgType}" />\n`;

        case 'Destination':
        case 'Download':
            return `      <${type} Name="${name}" />\n`;

        default:
            return `      <${type} Name="${name}" />\n`;
    }
};