import { realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { BluematadorMCPServer } from '../dist/index-stdio.js';

function behavior(annotations) {
  if (!annotations) return 'No annotations';
  if (annotations.readOnlyHint) return 'Read-only';
  if (annotations.destructiveHint !== false) return 'Destructive. Clients should ask before running it';
  return 'Creates or changes data';
}

function escapeMarkdown(text = '') {
  return text.replace(/[\\*_<]/g, (char) => `\\${char}`);
}

function escapeCell(text = '') {
  return escapeMarkdown(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function typeOf(schema) {
  if (schema.type === 'array') return `${schema.items?.type ?? 'any'}[]`;
  return schema.enum ? schema.enum.map((value) => `\`${value}\``).join(' \\| ') : schema.type ?? 'any';
}

function renderTool(tool) {
  const properties = Object.entries(tool.inputSchema.properties ?? {});
  const required = new Set(tool.inputSchema.required ?? []);
  const lines = [`## \`${tool.name}\``, '', escapeMarkdown(tool.description), '', `${behavior(tool.annotations)}.`, ''];
  if (properties.length === 0) {
    lines.push('No parameters.', '');
    return lines;
  }
  lines.push('| Parameter | Type | Required | Description |', '| --- | --- | --- | --- |');
  for (const [name, schema] of properties) {
    lines.push(`| \`${name}\` | ${typeOf(schema)} | ${required.has(name) ? 'yes' : 'no'} | ${escapeCell(schema.description)} |`);
  }
  lines.push('');
  return lines;
}

export function renderToolReference(tools) {
  return [
    '# Tool reference',
    '',
    `The server exposes ${tools.length} tools. This file is generated from the tool list by \`npm run docs\`, and \`npm test\` fails when it is out of date.`,
    '',
    ...tools.flatMap(renderTool),
  ].join('\n');
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await new BluematadorMCPServer('unused', 'unused', 'http://127.0.0.1:1').connect(serverTransport);
  const client = new Client({ name: 'generate-tool-reference', version: '0.0.0' });
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  await client.close();
  const target = fileURLToPath(new URL('../docs/API-REFERENCE.md', import.meta.url));
  writeFileSync(target, renderToolReference(tools));
  console.error(`Wrote ${tools.length} tools to ${target}`);
}
