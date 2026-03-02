import { useState, useRef, useCallback, useEffect } from "react";

const CIRCLE_COLORS = ["#E8443A", "#2E86DE", "#F39C12", "#27AE60", "#9B59B6"];

const ACCENT_COLORS = {
  1: "#9B59B6",
  2: "#F39C12",
  3: "#2E86DE",
  4: "#66BB6A",
  5: "#E8443A",
};

function DraggableCircle({ id, color, position, onDragStart, onDrag, onDragEnd, dragging }) {
  const ref = useRef(null);

  const handlePointerDown = (e) => {
    e.preventDefault();
    onDragStart(id, e.clientX, e.clientY);
    ref.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    onDrag(id, e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (!dragging) return;
    e.preventDefault();
    onDragEnd(id, e.clientX, e.clientY);
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        left: position.x - 28,
        top: position.y - 28,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color})`,
        border: `3px solid ${color}`,
        boxShadow: dragging
          ? `0 8px 25px rgba(0,0,0,0.3), 0 0 0 4px ${color}44`
          : `0 3px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)`,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 100 : 10,
        transform: dragging ? "scale(1.12)" : "scale(1)",
        transition: dragging ? "box-shadow 0.15s, transform 0.15s" : "all 0.3s ease-out",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          width: 18,
          height: 12,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.35)",
          transform: "rotate(-20deg)",
        }}
      />
    </div>
  );
}

function DropBox({ label, count, boxRef, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          fontWeight: 900,
          color: "#fff",
          fontFamily: "'Fredoka', sans-serif",
          boxShadow: `0 4px 12px ${color}55`,
          transition: "transform 0.2s",
          transform: count > 0 ? "scale(1)" : "scale(0.9)",
        }}
      >
        {count}
      </div>
      <div
        ref={boxRef}
        style={{
          width: "100%",
          minHeight: 200,
          maxWidth: 220,
          background: "rgba(255,255,255,0.7)",
          border: `3px dashed ${count > 0 ? color : "#ccc"}`,
          borderRadius: 16,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: 8,
          padding: 16,
          transition: "border-color 0.3s, background 0.3s",
          position: "relative",
        }}
      >
        {count === 0 && (
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 14,
              color: "#bbb",
              fontWeight: 500,
              textAlign: "center",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            Dra hit
          </div>
        )}
      </div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 16, color }}>{label}</div>
    </div>
  );
}

function SplitPage({ total }) {
  const containerRef = useRef(null);
  const leftBoxRef = useRef(null);
  const rightBoxRef = useRef(null);

  const initialPositions = useCallback(() => {
    return Array.from({ length: total }, (_, i) => ({
      id: i,
      color: CIRCLE_COLORS[i % CIRCLE_COLORS.length],
      box: null,
      x: 0, y: 0, dragX: 0, dragY: 0,
    }));
  }, [total]);

  const [circles, setCircles] = useState(initialPositions);
  const [draggingId, setDraggingId] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    setCircles(initialPositions());
    setLayoutReady(false);
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const startY = rect.height - 70;
        const spacing = Math.min(70, (rect.width - 80) / Math.max(total, 1));
        const startX = (rect.width - (total - 1) * spacing) / 2;
        setCircles((prev) =>
          prev.map((c, i) => ({ ...c, box: null, x: startX + i * spacing, y: startY, dragX: startX + i * spacing, dragY: startY }))
        );
        setLayoutReady(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [total, initialPositions]);

  const getBoxPositions = useCallback((boxRef, circlesInBox) => {
    if (!boxRef.current || !containerRef.current) return [];
    const boxRect = boxRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = boxRect.left - containerRect.left;
    const relY = boxRect.top - containerRect.top;
    const centerX = relX + boxRect.width / 2;
    const positions = [];
    const spacing = 64;
    const cols = Math.min(circlesInBox, 3);
    const rows = Math.ceil(circlesInBox / cols);
    const startY = relY + boxRect.height / 2 - ((rows - 1) * spacing) / 2;
    for (let i = 0; i < circlesInBox; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const colsInRow = row === rows - 1 ? circlesInBox - row * cols : cols;
      const rowStartX = centerX - ((colsInRow - 1) * spacing) / 2;
      positions.push({ x: rowStartX + col * spacing, y: startY + row * spacing });
    }
    return positions;
  }, []);

  const recalcPositions = useCallback((updatedCircles) => {
    const leftCircles = updatedCircles.filter((c) => c.box === "left");
    const rightCircles = updatedCircles.filter((c) => c.box === "right");
    const leftPositions = getBoxPositions(leftBoxRef, leftCircles.length);
    const rightPositions = getBoxPositions(rightBoxRef, rightCircles.length);
    let li = 0, ri = 0;
    return updatedCircles.map((c) => {
      if (c.box === "left" && leftPositions[li]) { const pos = leftPositions[li++]; return { ...c, x: pos.x, y: pos.y }; }
      if (c.box === "right" && rightPositions[ri]) { const pos = rightPositions[ri++]; return { ...c, x: pos.x, y: pos.y }; }
      return c;
    });
  }, [getBoxPositions]);

  const hitTest = useCallback((clientX, clientY) => {
    if (leftBoxRef.current) { const r = leftBoxRef.current.getBoundingClientRect(); if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return "left"; }
    if (rightBoxRef.current) { const r = rightBoxRef.current.getBoundingClientRect(); if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return "right"; }
    return null;
  }, []);

  const handleDragStart = useCallback((id, clientX, clientY) => {
    setDraggingId(id);
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setCircles((prev) => prev.map((c) => c.id === id ? { ...c, dragX: clientX - containerRect.left, dragY: clientY - containerRect.top } : c));
  }, []);

  const handleDrag = useCallback((id, clientX, clientY) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setCircles((prev) => prev.map((c) => c.id === id ? { ...c, dragX: clientX - containerRect.left, dragY: clientY - containerRect.top } : c));
  }, []);

  const handleDragEnd = useCallback((id, clientX, clientY) => {
    setDraggingId(null);
    const hitBox = hitTest(clientX, clientY);
    setCircles((prev) => {
      let updated = prev.map((c) => {
        if (c.id !== id) return c;
        if (hitBox) return { ...c, box: hitBox };
        if (c.box) {
          if (!containerRef.current) return { ...c, box: null };
          const rect = containerRef.current.getBoundingClientRect();
          const unplacedCount = prev.filter((cc) => cc.box === null && cc.id !== id).length;
          const spacing = Math.min(70, (rect.width - 80) / Math.max(total, 1));
          const totalUnplaced = unplacedCount + 1;
          const startX = (rect.width - (totalUnplaced - 1) * spacing) / 2;
          return { ...c, box: null, x: startX + unplacedCount * spacing, y: rect.height - 70 };
        }
        return c;
      });
      if (!containerRef.current) return recalcPositions(updated);
      const rect = containerRef.current.getBoundingClientRect();
      const unplaced = updated.filter((c) => c.box === null);
      const spacing = Math.min(70, (rect.width - 80) / Math.max(total, 1));
      const startX = (rect.width - (unplaced.length - 1) * spacing) / 2;
      let ui = 0;
      updated = updated.map((c) => {
        if (c.box === null) { const pos = { x: startX + ui * spacing, y: rect.height - 70 }; ui++; return { ...c, x: pos.x, y: pos.y }; }
        return c;
      });
      return recalcPositions(updated);
    });
  }, [hitTest, recalcPositions, total]);

  const leftCount = circles.filter((c) => c.box === "left").length;
  const rightCount = circles.filter((c) => c.box === "right").length;
  const allPlaced = leftCount + rightCount === total;
  const accentColor = ACCENT_COLORS[total];

  const handleReset = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spacing = Math.min(70, (rect.width - 80) / Math.max(total, 1));
    const startX = (rect.width - (total - 1) * spacing) / 2;
    setCircles((prev) => prev.map((c, i) => ({ ...c, box: null, x: startX + i * spacing, y: rect.height - 70, dragX: startX + i * spacing, dragY: rect.height - 70 })));
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: 520, background: "rgba(255,255,255,0.3)", borderRadius: 20, overflow: "hidden", border: "2px solid rgba(255,255,255,0.6)" }}>
      <div style={{ textAlign: "center", padding: "14px 0 8px" }}>
        <span style={{ width: 44, height: 44, borderRadius: "50%", background: accentColor, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Fredoka', sans-serif", boxShadow: `0 3px 8px ${accentColor}55` }}>{total}</span>
      </div>
      <div style={{ display: "flex", gap: 20, padding: "0 20px", justifyContent: "center" }}>
        <DropBox label="Vänster" count={leftCount} boxRef={leftBoxRef} color="#E8443A" />
        <div style={{ display: "flex", alignItems: "center", fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 900, color: "#2D5016", opacity: 0.4, paddingTop: 60 }}>+</div>
        <DropBox label="Höger" count={rightCount} boxRef={rightBoxRef} color="#2E86DE" />
      </div>
      {allPlaced && (
        <div style={{ textAlign: "center", marginTop: 12, fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, animation: "popIn 0.3s ease-out" }}>
          <span style={{ color: "#E8443A" }}>{leftCount}</span>
          <span style={{ color: "#666" }}> + </span>
          <span style={{ color: "#2E86DE" }}>{rightCount}</span>
          <span style={{ color: "#666" }}> = </span>
          <span style={{ color: accentColor }}>{total}</span>
        </div>
      )}
      {circles.some((c) => c.box === null) && (
        <div style={{ position: "absolute", bottom: 105, left: "50%", transform: "translateX(-50%)", fontFamily: "'Fredoka', sans-serif", fontSize: 13, color: "#999", fontWeight: 500 }}>
          Dra cirklarna till en ruta
        </div>
      )}
      <div style={{ position: "absolute", bottom: 8, right: 14 }}>
        <button onClick={handleReset} style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, padding: "5px 14px", borderRadius: 8, border: "2px solid #C9E4CA", background: "rgba(255,255,255,0.8)", color: "#4A7A25", cursor: "pointer" }}>
          Återställ
        </button>
      </div>
      {layoutReady && circles.map((circle) => (
        <DraggableCircle key={circle.id} id={circle.id} color={circle.color} position={draggingId === circle.id ? { x: circle.dragX, y: circle.dragY } : { x: circle.x, y: circle.y }} dragging={draggingId === circle.id} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} />
      ))}
    </div>
  );
}

export default function DragSplitApp() {
  const [total, setTotal] = useState(5);
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0F7E6 0%, #DFF0D0 100%)", fontFamily: "'Fredoka', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        @keyframes popIn { 0% { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        button:focus-visible { outline: 3px solid #F0D060; outline-offset: 2px; }
        * { -webkit-user-select: none; user-select: none; }
      `}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2D5016", margin: 0, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}>Dela talet</h1>
          <p style={{ fontSize: 15, color: "#4A7A25", fontWeight: 500, margin: "4px 0 0" }}>Dra cirklarna till rutorna</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setTotal(n)} style={{
              fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 17, padding: "8px 20px", borderRadius: 12,
              border: total === n ? "3px solid #2D5016" : "3px solid transparent",
              background: total === n ? "#fff" : "rgba(255,255,255,0.5)",
              color: total === n ? "#2D5016" : "#6B8F4E",
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: total === n ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}>
              {n}
            </button>
          ))}
        </div>
        <SplitPage key={total} total={total} />
      </div>
    </div>
  );
}
