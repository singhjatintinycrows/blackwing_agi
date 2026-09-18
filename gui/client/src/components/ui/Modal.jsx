import { useEffect, useRef } from 'react';

export function Modal({ open, onClose, title, subtitle, children, footer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = (e) => {
      if (e.target === el) onClose?.();
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="dw-dialog">
      <div className="dw-dialog__head">
        <h3 className="dw-dialog__title">{title}</h3>
        {subtitle && <span className="dw-dialog__sub">{subtitle}</span>}
      </div>
      <div className="dw-dialog__body">{children}</div>
      {footer && <div className="dw-dialog__foot">{footer}</div>}
    </dialog>
  );
}
