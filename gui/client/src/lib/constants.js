export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'];
export const STATUS_OPTIONS   = ['open', 'confirmed', 'remediated', 'wontfix'];
export const TOOL_TYPES       = ['scanner', 'proxy', 'fuzzer', 'custom'];

export const SEVERITY_COLORS = {
  critical: { bg: '#fce8ea', text: '#8b0a1a', border: '#d9697a' },
  high:     { bg: '#fbf0f2', text: '#b01a2d', border: '#e8a0a9' },
  medium:   { bg: '#fff8ed', text: '#8b5000', border: '#f5c57a' },
  low:      { bg: '#edf6ff', text: '#004777', border: '#7ab5e0' },
  info:     { bg: '#f6f7f9', text: '#5c6070', border: '#c8cdd8' },
};

export const STATUS_COLORS = {
  open:       { bg: '#fbf0f2', text: '#b01a2d' },
  confirmed:  { bg: '#fff8ed', text: '#8b5000' },
  remediated: { bg: '#edfaf4', text: '#1a6b3c' },
  wontfix:    { bg: '#f6f7f9', text: '#5c6070' },
};

export const STANDARDS = {
  owasp2025: {
    label: 'OWASP Top 10: 2025',
    items: [
      ['a01', 'A01:2025', 'Broken Access Control'],
      ['a02', 'A02:2025', 'Security Misconfiguration'],
      ['a03', 'A03:2025', 'Software Supply Chain Failures'],
      ['a04', 'A04:2025', 'Cryptographic Failures'],
      ['a05', 'A05:2025', 'Injection'],
      ['a06', 'A06:2025', 'Insecure Design'],
      ['a07', 'A07:2025', 'Authentication Failures'],
      ['a08', 'A08:2025', 'Software or Data Integrity Failures'],
      ['a09', 'A09:2025', 'Security Logging and Alerting Failures'],
      ['a10', 'A10:2025', 'Mishandling of Exceptional Conditions'],
    ],
  },
  api2023: {
    label: 'OWASP API Security Top 10: 2023',
    items: [
      ['api1',  'API1:2023',  'Broken Object Level Authorization'],
      ['api2',  'API2:2023',  'Broken Authentication'],
      ['api3',  'API3:2023',  'Broken Object Property Level Authorization'],
      ['api4',  'API4:2023',  'Unrestricted Resource Consumption'],
      ['api5',  'API5:2023',  'Broken Function Level Authorization'],
      ['api6',  'API6:2023',  'Unrestricted Access to Sensitive Business Flows'],
      ['api7',  'API7:2023',  'Server Side Request Forgery'],
      ['api8',  'API8:2023',  'Security Misconfiguration'],
      ['api9',  'API9:2023',  'Improper Inventory Management'],
      ['api10', 'API10:2023', 'Unsafe Consumption of APIs'],
    ],
  },
  sans25: {
    label: 'SANS Top 25',
    items: [
      ['cwe787', 'CWE-787', 'Out-of-bounds Write'],
      ['cwe79',  'CWE-79',  "Cross-site Scripting (XSS)"],
      ['cwe89',  'CWE-89',  "SQL Injection"],
      ['cwe416', 'CWE-416', 'Use After Free'],
      ['cwe78',  'CWE-78',  "OS Command Injection"],
      ['cwe20',  'CWE-20',  'Improper Input Validation'],
      ['cwe125', 'CWE-125', 'Out-of-bounds Read'],
      ['cwe22',  'CWE-22',  "Path Traversal"],
      ['cwe352', 'CWE-352', 'Cross-Site Request Forgery (CSRF)'],
      ['cwe434', 'CWE-434', 'Unrestricted Upload of File with Dangerous Type'],
      ['cwe862', 'CWE-862', 'Missing Authorization'],
      ['cwe476', 'CWE-476', 'NULL Pointer Dereference'],
      ['cwe287', 'CWE-287', 'Improper Authentication'],
      ['cwe190', 'CWE-190', 'Integer Overflow or Wraparound'],
      ['cwe502', 'CWE-502', 'Deserialization of Untrusted Data'],
      ['cwe77',  'CWE-77',  "Command Injection"],
      ['cwe119', 'CWE-119', 'Improper Restriction of Memory Buffer Operations'],
      ['cwe798', 'CWE-798', 'Use of Hard-coded Credentials'],
      ['cwe918', 'CWE-918', 'Server-Side Request Forgery (SSRF)'],
      ['cwe306', 'CWE-306', 'Missing Authentication for Critical Function'],
      ['cwe362', 'CWE-362', "Race Condition"],
      ['cwe269', 'CWE-269', 'Improper Privilege Management'],
      ['cwe94',  'CWE-94',  "Code Injection"],
      ['cwe863', 'CWE-863', 'Incorrect Authorization'],
      ['cwe276', 'CWE-276', 'Incorrect Default Permissions'],
    ],
  },
};

export const ROLES = ['Standard User', 'Standard User', 'Elevated'];

export const METHODS = {
  form: {
    note: 'The agent submits the login form and confirms an authenticated session was established.',
    fields: [
      ['loginurl',    'Login URL',          'url',  'https://storefront.staging.acme.io/session'],
      ['successInd',  'Success Indicator',  'text', 'Session cookie _sess is set'],
    ],
    cols: [['ref', 'Reference'], ['user', 'Username'], ['pass', 'Password']],
    seed: [
      ['Buyer, Organisation A', 'buyer.a@acme.io', 'Str0ngPass!A'],
      ['Buyer, Organisation B', 'buyer.b@acme.io', 'Str0ngPass!B'],
      ['Back Office',           'ops.admin@acme.io', 'Str0ngPass!C'],
    ],
  },
  header: {
    note: 'A long lived token is supplied for each account and attached to every request.',
    fields: [
      ['hdrName',   'Header Name',   'text', 'Authorization'],
      ['hdrPrefix', 'Value Prefix',  'text', 'Bearer '],
    ],
    cols: [['ref', 'Reference'], ['token', 'Token']],
    seed: [
      ['Buyer, Organisation A', 'eyJhbGciOiJIUzI1NiJ9.aG9sZGVyLWE'],
      ['Buyer, Organisation B', 'eyJhbGciOiJIUzI1NiJ9.aG9sZGVyLWI'],
      ['Back Office',           'eyJhbGciOiJIUzI1NiJ9.YWRtaW4tMDE'],
    ],
  },
  apikey: {
    note: 'A distinct key is required for each privilege level, otherwise authorisation controls cannot be evaluated.',
    fields: [
      ['keyLoc',  'Transmitted As',  'select', 'Request header|Query parameter|Cookie'],
      ['keyName', 'Parameter Name',  'text',   'X-Api-Key'],
    ],
    cols: [['ref', 'Reference'], ['token', 'API Key']],
    seed: [
      ['Buyer, Organisation A', 'ak_live_4f21c9de77'],
      ['Buyer, Organisation B', 'ak_live_9b30ea1c04'],
      ['Back Office',           'ak_live_admin_7c15'],
    ],
  },
  basic: {
    note: 'Credentials are attached to every request. No session state is maintained.',
    fields: [['realm', 'Realm', 'text', 'storefront-staging']],
    cols: [['ref', 'Reference'], ['user', 'Username'], ['pass', 'Password']],
    seed: [
      ['Buyer, Organisation A', 'buyer.a', 'Str0ngPass!A'],
      ['Buyer, Organisation B', 'buyer.b', 'Str0ngPass!B'],
      ['Back Office',           'ops.admin', 'Str0ngPass!C'],
    ],
  },
  oauth: {
    note: 'The agent exchanges each set of credentials for an access token and refreshes it on expiry.',
    fields: [
      ['tokenUrl',     'Token Endpoint', 'url',      'https://auth.staging.acme.io/oauth/token'],
      ['scope2',       'Scope',          'text',     'openid orders:read orders:write'],
      ['clientId',     'Client ID',      'text',     'blackwing-staging'],
      ['clientSecret', 'Client Secret',  'password', 'sk_staging_e41a9'],
    ],
    cols: [['ref', 'Reference'], ['user', 'Username'], ['pass', 'Password']],
    seed: [
      ['Buyer, Organisation A', 'buyer.a@acme.io', 'Str0ngPass!A'],
      ['Buyer, Organisation B', 'buyer.b@acme.io', 'Str0ngPass!B'],
      ['Back Office',           'ops.admin@acme.io', 'Str0ngPass!C'],
    ],
  },
  mtls: {
    note: 'A separate client certificate is required for each privilege level.',
    fields: [['caCert', 'CA Bundle', 'text', 'staging-ca.pem']],
    cols: [['ref', 'Reference'], ['cert', 'Client Certificate'], ['key', 'Private Key']],
    seed: [
      ['Buyer, Organisation A', 'buyer-a.pem', 'buyer-a.key'],
      ['Buyer, Organisation B', 'buyer-b.pem', 'buyer-b.key'],
      ['Back Office',           'ops-admin.pem', 'ops-admin.key'],
    ],
  },
  none: {
    note: 'The agent will assess the unauthenticated surface only. Authorisation testing is not available.',
    fields: [],
    cols: [],
    seed: [],
  },
  sso: {
    note: 'An identity provider flow cannot be driven reliably by an automated agent. Select the method by which the development team will provide session access.',
    sub: {
      label: 'Session Acquisition Method',
      options: [
        ['bypass',   'Local login route that bypasses the identity provider'],
        ['token',    'Session values issued by the development team'],
        ['grant',    'Service account token endpoint'],
        ['recorded', 'Recorded sign in for replay'],
      ],
      panels: {
        bypass: {
          note: 'Preferred where available. Confirm with the development team that the route is disabled in production.',
          fields: [
            ['bypassUrl',   'Local Login Route',    'url',  'https://storefront.staging.acme.io/dev/login'],
            ['bypassGuard', 'Production Safeguard', 'text', 'Feature flag DEV_LOGIN, disabled in production builds'],
          ],
          cols: [['ref', 'Reference'], ['user', 'Username'], ['pass', 'Password']],
          seed: [
            ['Buyer, Organisation A', 'buyer.a@acme.io', 'Str0ngPass!A'],
            ['Buyer, Organisation B', 'buyer.b@acme.io', 'Str0ngPass!B'],
            ['Back Office',           'ops.admin@acme.io', 'Str0ngPass!C'],
          ],
        },
        token: {
          note: 'Fastest to arrange. Session values expire, and an assessment may outlast them.',
          fields: [
            ['cookieName',  'Cookie or Header Name', 'text', 'sid'],
            ['sessionTtl',  'Session Lifetime',      'text', '8 hours'],
          ],
          cols: [['ref', 'Reference'], ['token', 'Session Value']],
          seed: [
            ['Buyer, Organisation A', 's%3Ak1f9c2ae.7Qd1LxN0'],
            ['Buyer, Organisation B', 's%3Ak8b0d31f.2Rm9YtP4'],
            ['Back Office',           's%3Ak3e7a95c.5Tz2WbK8'],
          ],
        },
        grant: {
          note: 'Suitable for extended assessments, as the agent can obtain a new token whenever required.',
          fields: [
            ['idp',          'Identity Provider', 'select', 'Okta|Microsoft Entra ID|Google Workspace|Ping Identity|Generic OIDC'],
            ['tokenUrl2',    'Token Endpoint',    'url',    'https://acme.okta.com/oauth2/v1/token'],
            ['clientId2',    'Client ID',         'text',   '0oa4staging8x'],
            ['clientSecret2','Client Secret',     'password','sk_okta_3f81b0'],
          ],
          cols: [['ref', 'Reference'], ['user', 'Service Account'], ['pass', 'Secret']],
          seed: [
            ['Buyer, Organisation A', 'svc.buyer.a@acme.io', 'Sv1cA!7723'],
            ['Buyer, Organisation B', 'svc.buyer.b@acme.io', 'Sv1cB!4419'],
            ['Back Office',           'svc.ops.admin@acme.io', 'Sv1cC!9052'],
          ],
        },
        recorded: {
          note: 'Least reliable option. Recordings break when the identity provider alters its pages.',
          fields: [
            ['recording', 'Recorded Sign In',    'text',   'sso-login.har'],
            ['mfaNote',   'Multi Factor Handling','select', 'Disabled for these accounts|TOTP seed supplied|Operator prompt'],
          ],
          cols: [['ref', 'Reference'], ['user', 'Username'], ['pass', 'Password']],
          seed: [
            ['Buyer, Organisation A', 'buyer.a@acme.io', 'Str0ngPass!A'],
            ['Buyer, Organisation B', 'buyer.b@acme.io', 'Str0ngPass!B'],
            ['Back Office',           'ops.admin@acme.io', 'Str0ngPass!C'],
          ],
        },
      },
    },
  },
};
