import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const translationSource = fs.readFileSync(new URL('../web/translations.js', import.meta.url), 'utf8');
const i18nSource = fs.readFileSync(new URL('../web/i18n.js', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');

const property = {
  id: 1,
  name: 'Sunrise Luxury PG',
  area: 'Hitech City',
  address: 'Cyber Towers Road, Hyderabad',
  type: 'Co-living',
  price: 12000,
  deposit: 12000,
  lat: 17.45,
  lon: 78.38,
  amen: ['Wi-Fi', 'Meals', 'AC'],
  photo: '/media/main.jpg',
  photos: ['/media/main.jpg', '/media/room2.jpg'],
  video_url: 'https://youtube.com/watch?v=samplepg',
  merchant_account_id: 'acc_owner123',
  beds: 3,
  sharing: 2,
  sharing_options: [2],
  phone: '9876543210',
  closing: '23:00',
  notice_days: 30,
  rules: 'No smoking indoors',
  updated: '2026-11-20T10:00:00',
  published: true,
};

const user = {
  id: 1,
  name: 'Verified Host',
  email: 'host@example.test',
  phone: '9876543210',
  phone_verified: false,
  owner_approved: true,
  tenant: false,
  properties: [{ id: 1, name: property.name, published: true }],
};

const state = {
  property,
  tenancy: null,
  requests: [],
  announcements: [],
  menu: { breakfast: 'Dosa', lunch: 'Meals', dinner: 'Roti' },
  invoices: [],
  beds: [{ id: 1, room: '101', label: 'A', sharing: 2, active: true, occupied: false }],
  tenants: [],
  joins: [],
  enquiries: [],
  join_url: 'https://example.test/?join=code',
};

async function createSandbox() {
  const nodes = new Map();
  const node = (k) => {
    if (!nodes.has(k)) {
      nodes.set(k, {
        innerHTML: '',
        textContent: '',
        value: '',
        open: false,
        classList: { add() {}, remove() {} },
        addEventListener() {},
        showModal() { this.open = true; },
        close() { this.open = false; },
      });
    }
    return nodes.get(k);
  };
  const responses = {
    '/api/me': user,
    '/api/properties': [property],
    '/api/saved': [],
    '/api/enquiries': [],
    '/api/owner/1?offset=0': state,
    '/api/invoices?offset=0': [],
  };
  const context = vm.createContext({
    console,
    URLSearchParams,
    URL,
    Date,
    Math,
    Number,
    String,
    JSON,
    Promise,
    Uint8Array,
    Error,
    FormData,
    document: {
      querySelector: node,
      hidden: false,
      activeElement: null,
    },
    navigator: {},
    location: { search: '', pathname: '/' },
    history: { replaceState() {} },
    setInterval() {},
    setTimeout() {},
    window: { print() { globalThis.printed = true; } },
    fetch: async (url, opts) => {
      globalThis.lastFetch = { url, opts };
      return {
        ok: true,
        status: 200,
        json: async () => structuredClone(responses[new URL(url, 'http://test').pathname + new URL(url, 'http://test').search] ?? {}),
      };
    },
  });
  vm.runInContext(translationSource, context);
  vm.runInContext(i18nSource, context);
  vm.runInContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  return { context, nodes, run: (s) => vm.runInContext(s, context) };
}

test('auth dialog provides forgot password reset action', async () => {
  const q = await createSandbox();
  q.run('auth(false)');
  assert.match(q.nodes.get('#modal').innerHTML, /Forgot password\?/);
  q.run('forgotPassword()');
  assert.match(q.nodes.get('#modal').innerHTML, /Reset your password/);
  assert.match(q.nodes.get('#modal').innerHTML, /Send reset code/);
});

test('account settings renders phone verification OTP section', async () => {
  const q = await createSandbox();
  q.run('accountSettings()');
  assert.match(q.nodes.get('#modal').innerHTML, /Verify your phone number \(OTP\)/);
  assert.match(q.nodes.get('#modal').innerHTML, /Send OTP/);
  assert.match(q.nodes.get('#modal').innerHTML, /Privacy Policy/);
  assert.match(q.nodes.get('#modal').innerHTML, /Terms of Service/);
  assert.match(q.nodes.get('#modal').innerHTML, /Refund Policy/);
});

test('hostel detail modal renders photo gallery thumbnails and video tour button', async () => {
  const q = await createSandbox();
  q.run('detail(1)');
  const modalHtml = q.nodes.get('#modal').innerHTML;
  assert.match(modalHtml, /Watch video tour/);
  assert.match(modalHtml, /room2\.jpg/);
});

test('owner workspace supports reception standee generation', async () => {
  const q = await createSandbox();
  await q.run("setMode('Owner')");
  q.run("ownerTab='Tenants & QR'; render()");
  assert.match(q.nodes.get('#app').innerHTML, /Print reception QR standee/);
  q.run('printStandee()');
  assert.match(q.nodes.get('#modal').innerHTML, /Official Reception Check-in/);
  assert.match(q.nodes.get('#modal').innerHTML, /Sunrise Luxury PG/);
});
