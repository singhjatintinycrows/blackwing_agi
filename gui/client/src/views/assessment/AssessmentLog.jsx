import { useEffect, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useSSE } from '../../hooks/useSSE';

export function AssessmentLog({ runId, status, logLines, onLog, onDone, onClose }) {
  const logRef = useRef(null);

  useSSE(
    runId ? `/api/assessments/${runId}/stream` : null,
    { onLog, onDone, onStreamError: onDone },
    status === 'running'
  );

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  const stateLabel = status === 'running'
    ? `${runId} — in progress`
    : status === 'complete'
    ? `${runId} — complete`
    : status === 'aborted'
    ? `${runId} — aborted`
    : runId || '';

  function cls(line) {
    if (line.text?.startsWith('[FINDING]')) return 'fd';
    if (line.text?.startsWith('[STATUS]'))  return 'ok';
    if (line.text?.startsWith('[THINK]'))   return 'th';
    return line.cls || '';
  }

  return (
    <Modal
      open={!!runId}
      onClose={status !== 'running' ? onClose : undefined}
      title="Assessment Log"
      subtitle={stateLabel}
      footer={
        <button
          type="button"
          className="dw-btn dw-btn--ghost"
          onClick={onClose}
          disabled={status === 'running'}
        >
          Close
        </button>
      }
    >
      <div className="dw-log" ref={logRef}>
        {logLines.map((line, i) => {
          const c = cls(line);
          const ts = Math.floor(i / 10);
          const mm = String(Math.floor(ts / 60)).padStart(2, '0');
          const ss = String(ts % 60).padStart(2, '0');
          return (
            <div key={i}>
              <span className="dw-log__ts">{mm}:{ss}</span>{' '}
              <span className={c ? `dw-log__${c}` : ''}>{line.text}</span>
            </div>
          );
        })}
        {status === 'running' && (
          <div><span className="dw-log__cursor">▌</span></div>
        )}
      </div>
    </Modal>
  );
}
