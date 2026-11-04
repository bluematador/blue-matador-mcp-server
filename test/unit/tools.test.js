import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { BluematadorMCPServer } from '../../dist/index-stdio.js';

const API_KEY = 'test-api-key';
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

async function startApiStub(routes) {
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://stub');
    requests.push({ method: req.method, url, headers: req.headers });
    const body = routes[`${req.method} ${url.pathname}`];
    res.writeHead(body === undefined ? 404 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body ?? { message: 'not found' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function connectClient(t, server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  t.after(() => client.close());
  return client;
}

test('lists the tools the server registers', async (t) => {
  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, 'http://127.0.0.1:1'));
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);

  assert.ok(names.includes('get_active_events'));
  assert.ok(names.includes('get_metrics'));
  assert.ok(names.includes('create_mute_rule'));
});

test('get_active_events calls the API with the account key and renders each event', async (t) => {
  const api = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [
      {
        id: 'event-1',
        accountId: ACCOUNT_ID,
        opened: '2026-11-01T05:00:00Z',
        eventType: 'aws.sqs.queue.depth',
        typeText: 'High Queue Depth',
        summaryText: 'orders-queue has 12000 visible messages',
        detailTexts: [],
        severity: 'alert',
        source: {
          label: 'orders-queue',
          text: 'orders-queue',
          tags: [],
          ref: { arn: 'arn:aws:sqs:us-east-1:123456789012:orders-queue', refType: 'aws.sqs.queue' },
        },
        links: [],
        projects: [],
      },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_active_events', arguments: {} });
  const text = result.content[0].text;

  assert.equal(api.requests.length, 1);
  assert.equal(api.requests[0].headers.authorization, API_KEY);
  assert.match(text, /High Queue Depth/);
  assert.match(text, /orders-queue has 12000 visible messages/);
  assert.match(text, /arn:aws:sqs:us-east-1:123456789012:orders-queue/);
  assert.match(text, /event-1/);
});

test('get_active_events forwards the project filter as a query parameter', async (t) => {
  const api = await startApiStub({ [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [] });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_active_events', arguments: { project: 'project-1' } });

  assert.equal(api.requests[0].url.searchParams.get('project'), 'project-1');
  assert.equal(result.content[0].text, 'No active events found for project project-1.');
});

test('tool calls report missing credentials instead of calling the API', async (t) => {
  const saved = { key: process.env.BLUEMATADOR_API_KEY, account: process.env.BLUEMATADOR_ACCOUNT_ID };
  delete process.env.BLUEMATADOR_API_KEY;
  delete process.env.BLUEMATADOR_ACCOUNT_ID;
  t.after(() => {
    if (saved.key !== undefined) process.env.BLUEMATADOR_API_KEY = saved.key;
    if (saved.account !== undefined) process.env.BLUEMATADOR_ACCOUNT_ID = saved.account;
  });

  const client = await connectClient(t, new BluematadorMCPServer());
  const result = await client.callTool({ name: 'get_active_events', arguments: {} });

  assert.match(result.content[0].text, /Missing Bluematador credentials: BLUEMATADOR_API_KEY, BLUEMATADOR_ACCOUNT_ID/);
});
