import { useEffect, useRef } from 'react';

/**
 * DotGrid — flat mathematical dot-grid with subtle pointer parallax.
 * SVG-tile background (no gradients, no canvas, no particle system).
 * rAF lerps a low-amplitude offset; touch + reduced-motion get static grid.
 */
const DotGrid = ({ className = '', density = 28, strength = 10 }) => {
  const layerRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) return undefined;

    let active = true;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      target.current = { x: nx * strength, y: ny * strength };
    };
    const tick = () => {
      if (!active) return;
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      layer.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`;
      raf.current = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf.current);
      window.removeEventListener('pointermove', onMove);
    };
  }, [strength]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="dot-grid-base absolute -inset-8" style={{ backgroundSize: `${density}px ${density}px` }} />
      <div ref={layerRef} className="dot-grid-layer absolute -inset-8" style={{ backgroundSize: `${density}px ${density}px` }} />
    </div>
  );
};

export default DotGrid;
