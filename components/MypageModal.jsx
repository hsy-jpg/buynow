"use client";

import { useState } from "react";

/** 메뉴 탭을 누르면 그 위에 창(모달)이 뜨고, 그 안에서만 내용이 동작한다. */
export function MypageModal({ emoji, label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="menu-item" onClick={() => setOpen(true)}>
        <span className="emoji">{emoji}</span> {label} <span className="arrow">›</span>
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{emoji} {label}</span>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
