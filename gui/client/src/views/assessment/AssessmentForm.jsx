import { useState, useCallback } from 'react';
import { METHODS, STANDARDS, ROLES } from '../../lib/constants';
import { useAssessment } from '../../hooks/useAssessment';
import { AssessmentLog } from './AssessmentLog';
import { api } from '../../lib/api';

function idsFor(std) {
  return STANDARDS[std].items.map(i => i[0]);
}

function getMethodCfg(method, strategy) {
  if (method === 'sso') {
    const s = strategy || 'bypass';
    return { ...METHODS.sso.sub.panels[s], strategy: s };
  }
  return METHODS[method] || METHODS.form;
}

function defaultScope() {
  const s = new Set();
  idsFor('owasp2025').forEach(id => s.add(id));
  return s;
}

function defaultAccounts(method, strategy) {
  const cfg = getMethodCfg(method, strategy);
  return (cfg.seed || []).map((vals, i) => {
    const row = { role: ROLES[i] || 'Standard User' };
    (cfg.cols || []).forEach((col, n) => { row[col[0]] = vals[n] || ''; });
    return row;
  });
}

export function AssessmentForm() {
  const [appName,    setAppName]    = useState('Acme Wholesale Storefront');
  const [devContact, setDevContact] = useState('priya.n@acme.io');
  const [target,     setTarget]     = useState('https://storefront.staging.acme.io');
  const [desc,       setDesc]       = useState('A wholesale storefront. Each account belongs to a single organisation.');
  const [spec,       setSpec]       = useState('https://storefront.staging.acme.io/openapi.json');
  const [restricted, setRestricted] = useState('/logout, /account/password');
  const [method,     setMethod]     = useState('form');
  const [strategy,   setStrategy]   = useState('bypass');
  const [accounts,   setAccounts]   = useState(() => defaultAccounts('form', 'bypass'));
  const [activeStds, setActiveStds] = useState(new Set(['owasp2025']));
  const [scope,      setScope]      = useState(defaultScope);
  const [intrusive,  setIntrusive]  = useState(true);
  const [findVal,    setFindVal]    = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [validating, setValidating] = useState(false);
  const [valResults, setValResults] = useState({});
  const [logOpen,    setLogOpen]    = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { runId, status, logLines, start, abort, appendLog, complete, reset } = useAssessment();

  const cfg = getMethodCfg(method, strategy);

  function handleMethodChange(m) {
    setMethod(m);
    setAccounts(defaultAccounts(m, strategy));
    setValResults({});
  }

  function handleStrategyChange(s) {
    setStrategy(s);
    setAccounts(defaultAccounts(method, s));
    setValResults({});
  }

  function toggleStd(std) {
    setActiveStds(prev => {
      const next = new Set(prev);
      if (next.has(std)) {
        next.delete(std);
        const newScope = new Set(scope);
        idsFor(std).forEach(id => newScope.delete(id));
        setScope(newScope);
      } else {
        next.add(std);
        const newScope = new Set(scope);
        idsFor(std).forEach(id => newScope.add(id));
        setScope(newScope);
      }
      return next;
    });
  }

  function toggleScopeItem(id) {
    setScope(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function updateAccount(i, field, val) {
    setAccounts(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
    setValResults(prev => { const n = { ...prev }; delete n[i]; return n; });
  }

  function removeAccount(i) {
    setAccounts(prev => prev.filter((_, idx) => idx !== i));
  }

  function addAccount() {
    const row = { role: 'Standard User' };
    (cfg.cols || []).forEach(col => { row[col[0]] = ''; });
    setAccounts(prev => [...prev, row]);
  }

  async function handleValidate() {
    setValidating(true);
    setValResults({});
    try {
      const { results } = await api.post('/api/validate-credentials', {
        method, strategy, accounts,
      });
      const map = {};
      results.forEach(r => { map[r.index] = r.status; });
      setValResults(map);
    } catch {
      // silent – individual statuses remain unknown
    }
    setValidating(false);
  }

  const scopeCount = [...activeStds].reduce((n, s) => {
    return n + STANDARDS[s].items.filter(it => scope.has(it[0])).length;
  }, 0);

  const roles = new Set(accounts.map(a => a.role));
  const canRun = authorized && target && scopeCount > 0;

  async function handleRun() {
    setSubmitError('');
    setLogOpen(true);
    try {
      await start({
        appName, devContact, target, description: desc, spec,
        restrictedPaths: restricted, method, strategy, accounts,
        selectedScope: [...scope], activeStandards: [...activeStds],
        intrusive, findingValidation: findVal,
      });
    } catch (err) {
      setSubmitError(err.message);
    }
  }

  function handleLogClose() {
    if (status === 'running') return;
    setLogOpen(false);
    reset();
  }

  // Render auth panel fields
  function renderFields(fields) {
    if (!fields || !fields.length) return null;
    return (
      <div className="dw-grid" style={{ marginTop: 14 }}>
        {fields.map(([id, lb, type, def]) => (
          <label key={id}>
            <span className="dw-label">{lb}</span>
            {type === 'select' ? (
              <select id={id} defaultValue={def.split('|')[0]}>
                {def.split('|').map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type} id={id} className="mono" defaultValue={def} />
            )}
          </label>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="dw-form-page">
        {/* Application Details */}
        <section className="dw-section">
          <div className="dw-section__head">
            <h2>Application Details</h2>
            <p>Information supplied by the development team for the purpose of this assessment.</p>
          </div>
          <div className="dw-grid">
            <label>
              <span className="dw-label">Application Name</span>
              <input type="text" value={appName} onChange={e => setAppName(e.target.value)} />
            </label>
            <label>
              <span className="dw-label">Development Contact</span>
              <input type="text" value={devContact} onChange={e => setDevContact(e.target.value)} />
            </label>
            <label className="dw-grid__full">
              <span className="dw-label">Staging URL</span>
              <input type="url" className="mono" value={target} onChange={e => setTarget(e.target.value)} />
            </label>
            <label className="dw-grid__full">
              <span className="dw-label">Application Description</span>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
            </label>
            <label>
              <span className="dw-label">API Specification <i style={{ fontStyle: 'normal', color: 'var(--dim)', fontWeight: 400 }}>Optional</i></span>
              <input type="url" className="mono" value={spec} onChange={e => setSpec(e.target.value)} placeholder="Not supplied" />
            </label>
            <label>
              <span className="dw-label">Restricted Paths</span>
              <input type="text" className="mono" value={restricted} onChange={e => setRestricted(e.target.value)} />
            </label>
          </div>
        </section>

        {/* Authentication */}
        <section className="dw-section">
          <div className="dw-section__head">
            <h2>Authentication</h2>
            <p>Select the mechanism implemented by the application.</p>
          </div>

          <label style={{ maxWidth: 360 }}>
            <span className="dw-label">Authentication Method</span>
            <select value={method} onChange={e => handleMethodChange(e.target.value)}>
              <option value="form">Form Based Login</option>
              <option value="header">Bearer Token or Authorization Header</option>
              <option value="apikey">API Key</option>
              <option value="basic">HTTP Basic</option>
              <option value="oauth">OAuth 2.0 Password Grant</option>
              <option value="sso">Single Sign On (SAML or OIDC)</option>
              <option value="mtls">Mutual TLS</option>
              <option value="none">Unauthenticated</option>
            </select>
          </label>

          <div className="dw-authpanel">
            <p className="dw-authpanel__note">{METHODS[method]?.note}</p>
            {method === 'sso' ? (
              <>
                <label style={{ maxWidth: 400, marginTop: 14 }}>
                  <span className="dw-label">{METHODS.sso.sub.label}</span>
                  <select value={strategy} onChange={e => handleStrategyChange(e.target.value)}>
                    {METHODS.sso.sub.options.map(([v, t]) => (
                      <option key={v} value={v}>{t}</option>
                    ))}
                  </select>
                </label>
                <p className="hint">{METHODS.sso.sub.panels[strategy]?.note}</p>
                {renderFields(METHODS.sso.sub.panels[strategy]?.fields)}
              </>
            ) : (
              renderFields(METHODS[method]?.fields)
            )}
          </div>

          {cfg.cols && cfg.cols.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <span className="dw-label">
                Test Accounts{' '}
                <i style={{ fontStyle: 'normal', color: 'var(--dim)', fontWeight: 400 }}>
                  Two accounts at an equivalent privilege level and one elevated account are recommended.
                </i>
              </span>

              {/* Header row */}
              <div className="dw-ident-hdr" style={{ gridTemplateColumns: cfg.cols.map((_, i) => i === 0 ? '1.1fr' : '1.4fr').join(' ') + ' 130px 84px 30px' }}>
                {cfg.cols.map(c => <span key={c[0]}>{c[1]}</span>)}
                <span>Privilege Level</span>
                <span>Status</span>
                <span />
              </div>

              {accounts.map((acc, i) => (
                <div key={i} className="dw-ident" style={{ gridTemplateColumns: cfg.cols.map((_, j) => j === 0 ? '1.1fr' : '1.4fr').join(' ') + ' 130px 84px 30px' }}>
                  {cfg.cols.map(col => (
                    <input
                      key={col[0]}
                      type={col[0] === 'pass' ? 'password' : 'text'}
                      className={col[0] === 'ref' ? '' : 'mono'}
                      value={acc[col[0]] || ''}
                      placeholder={col[1]}
                      onChange={e => updateAccount(i, col[0], e.target.value)}
                    />
                  ))}
                  <select value={acc.role} onChange={e => updateAccount(i, 'role', e.target.value)}>
                    <option>Standard User</option>
                    <option>Elevated</option>
                    <option>Administrator</option>
                  </select>
                  <span className={`dw-val-status${valResults[i] === 'validated' ? ' ok' : valResults[i] === 'incomplete' || valResults[i] === 'expired' ? ' bad' : ''}`}>
                    {valResults[i] ? valResults[i] : 'Not validated'}
                  </span>
                  <button type="button" className="dw-remove-btn" aria-label="Remove" onClick={() => removeAccount(i)}>&times;</button>
                </div>
              ))}

              <div className="dw-rowbtn" style={{ marginTop: 10 }}>
                <button type="button" className="dw-add-btn" onClick={addAccount}>Add Account</button>
                <button type="button" className="dw-verify-btn" disabled={validating || !accounts.length} onClick={handleValidate}>
                  {validating ? 'Validating…' : 'Validate Credentials'}
                </button>
              </div>

              <p className="dw-hint">
                {method === 'none'
                  ? 'Not applicable to an unauthenticated assessment.'
                  : accounts.length < 2
                  ? 'A single account is insufficient. The agent cannot distinguish an authorisation boundary from absent functionality.'
                  : roles.size < 2
                  ? 'All accounts share one privilege level. Add an elevated account to assess privilege escalation.'
                  : `${accounts.length} accounts across ${roles.size} privilege levels.`}
              </p>
            </div>
          )}
        </section>

        {/* Assessment Configuration */}
        <section className="dw-section">
          <div className="dw-section__head">
            <h2>Assessment Configuration</h2>
            <p>Select the standards this assessment is measured against.</p>
          </div>

          <span className="dw-label">Testing Standard</span>
          <div className="dw-chips">
            {Object.entries(STANDARDS).map(([key, std]) => (
              <button
                key={key}
                type="button"
                className={`dw-chip dw-chip--std${activeStds.has(key) ? ' dw-chip--pressed' : ''}`}
                aria-pressed={activeStds.has(key)}
                onClick={() => toggleStd(key)}
              >
                {std.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="dw-label">Assessment Scope</span>
            {[...activeStds].map(stdKey => (
              <div key={stdKey} className="dw-scope-group">
                <h4>{STANDARDS[stdKey].label}</h4>
                <div className="dw-chips">
                  {STANDARDS[stdKey].items.map(([id, ref, name]) => (
                    <button
                      key={id}
                      type="button"
                      className={`dw-chip${scope.has(id) ? ' dw-chip--pressed' : ''}`}
                      aria-pressed={scope.has(id)}
                      onClick={() => toggleScopeItem(id)}
                    >
                      <span className="dw-chip__ref">{ref}</span>{name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="dw-hint">
              {activeStds.size === 0
                ? 'Select at least one testing standard.'
                : `${scopeCount} categories selected.`}
            </p>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="dw-switch">
              <input type="checkbox" checked={intrusive} onChange={e => setIntrusive(e.target.checked)} />
              <span className="dw-switch__track" />
              <span className="dw-switch__text">
                Intrusive Assessment
                <small>On confirmation of a finding, the agent continues testing to establish the full extent of the exposure.</small>
              </span>
            </label>
            <label className="dw-switch">
              <input type="checkbox" checked={findVal} onChange={e => setFindVal(e.target.checked)} />
              <span className="dw-switch__track" />
              <span className="dw-switch__text">
                Finding Validation
                <small>Each finding is reproduced from a new session before it is recorded in the report.</small>
              </span>
            </label>
          </div>

          <div className={`dw-attest${authorized ? ' dw-attest--ok' : ''}`}>
            <label className="dw-switch">
              <input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)} />
              <span className="dw-switch__track" />
              <span className="dw-switch__text">
                Authorisation Confirmed
                <small>The development team has authorised security testing of this staging environment.</small>
              </span>
            </label>
          </div>

          {submitError && <p className="dw-error" style={{ marginTop: 12 }}>{submitError}</p>}

          <div className="dw-form-foot">
            <button
              type="button"
              className="dw-btn dw-btn--primary dw-btn--lg"
              disabled={!canRun}
              onClick={handleRun}
            >
              Run Assessment
            </button>
          </div>
        </section>
      </div>

      {logOpen && (
        <AssessmentLog
          runId={runId}
          status={status}
          logLines={logLines}
          onLog={line => appendLog(line)}
          onDone={complete}
          onClose={handleLogClose}
        />
      )}
    </>
  );
}
