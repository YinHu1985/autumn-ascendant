
import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as topojson from 'topojson-client';
import { geoPath, geoIdentity } from 'd3-geo';
import { useSelector } from 'react-redux';
import { selectSettlements, selectCountries } from '../store/gameState';
import { LocManager } from '../systems/LocManager';
import { getSettlementName } from '../utils/localizationUtils';

// Types for the Map Data
interface MapFeature {
  type: 'Feature';
  id: string; // The province ID (e.g. "prov_1")
  properties: {
    id: string;
    // Add other static properties here (terrain, base_tax, etc)
  };
  geometry: any;
}

export type MapMode = 'political' | 'terrain';

interface VectorMapProps {
  mapData: any;
  onProvinceSelect?: (id: string) => void;
  width?: number;
  height?: number;
  debugMode?: boolean;
  mapMode?: MapMode;
  showConnections?: boolean;
  selectedSettlementId?: string | null;
  interactionMode?: 'normal' | 'armyMove';
  validTargetSettlementIds?: string[];
  onTargetSelect?: (id: string) => void;
}

export default function VectorMap({
  mapData,
  onProvinceSelect,
  width = 2000,
  height = 1000,
  debugMode = false,
  mapMode = 'political',
  showConnections = true,
  selectedSettlementId = null,
  interactionMode = 'normal',
  validTargetSettlementIds = [],
  onTargetSelect,
}: VectorMapProps) {
  const settlements = useSelector(selectSettlements);
  const countries = useSelector(selectCountries);
  
  // Subscribe to LocManager to force re-render on loc changes
  const [, setTick] = useState(0)
  useEffect(() => {
    return LocManager.getInstance().subscribe(() => {
      setTick(t => t + 1)
    })
  }, [])

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false); // Tracks if mouse is currently down and dragging
  const hasDraggedRef = useRef(false); // Tracks if a drag occurred during the current click interaction

  const lastMousePos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const riverImageRef = useRef<HTMLImageElement | null>(null);
  const [riverReady, setRiverReady] = useState(false);
  
  // Convert TopoJSON to GeoJSON Features
  const features = useMemo(() => {
    if (!mapData) return [];
    // @ts-ignore
    return topojson.feature(mapData, mapData.objects.provinces).features as MapFeature[];
  }, [mapData]);
  
  // Create a Path Generator
  const pathGenerator = useMemo(() => {
    return geoPath().projection(geoIdentity());
  }, []);

  const provincePaths = useMemo(() => {
    if (!features.length) return [];
    const list: { id: string; path: Path2D }[] = [];
    for (const feature of features) {
      const id = (feature.properties?.id || feature.id) as string;
      const d = pathGenerator(feature);
      if (!d) continue;
      list.push({ id, path: new Path2D(d) });
    }
    return list;
  }, [features, pathGenerator]);

  useEffect(() => {
    const img = new Image();
    img.src = '/river.png';
    img.onload = () => {
      riverImageRef.current = img;
      setRiverReady(true);
    };
  }, []);

  // Settlement Position Lookup
  const settlementPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    settlements.forEach(s => {
      map.set(s.id, s.position);
    });
    return map;
  }, [settlements]);

  // Settlement Data Lookup (Owner, Terrain, etc.)
  const settlementData = useMemo(() => {
    const map = new Map<string, any>();
    settlements.forEach(s => {
      map.set(s.id, s);
    });
    return map;
  }, [settlements]);

  const getProvinceFill = (featureId: string): string => {
    const settlementId = featureId.startsWith('settlement-') ? featureId : `settlement-${featureId}`;
    const settlement = settlementData.get(settlementId);

    if (!settlement) {
      return '#e5ddc5';
    }

    if (mapMode === 'terrain') {
      switch (settlement.terrain) {
        case 'forest': return '#15803d';
        case 'hills': return '#a8a29e';
        case 'mountains': return '#4b5563';
        case 'water': return '#3b82f6';
        case 'marsh': return '#0f766e';
        case 'plain':
        default: return '#e5ddc5';
      }
    }

    const owner = settlement.ownerId ? countries[settlement.ownerId] : null;
    if (owner) {
      return owner.color;
    }
    if (settlement.terrain === 'water') {
      return '#3b82f6';
    }
    return '#ffffff';
  };

  // Pan & Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.5, Math.min(5, transform.k * (1 + scaleAmount)));
    
    // Zoom towards mouse pointer logic could go here, 
    // for now we stick to simple center-ish zoom or just scale
    setTransform(t => clampTransform({ ...t, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent native drag behavior (ghost image)
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    setIsDragging(false); // Reset UI state
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const clampTransform = (t: { x: number, y: number, k: number }) => {
    const k = t.k;
    const scaledWidth = width * k;
    const scaledHeight = height * k;

    let x = t.x;
    let y = t.y;

    // X Axis Logic
    if (scaledWidth < width) {
        // If zoomed out, center the map horizontally
        x = (width - scaledWidth) / 2;
    } else {
        // If zoomed in, clamp to edges (strict containment)
        const minX = width - scaledWidth;
        const maxX = 0;
        x = Math.min(Math.max(x, minX), maxX);
    }

    // Y Axis Logic
    if (scaledHeight < height) {
        // If zoomed out, center the map vertically
        y = (height - scaledHeight) / 2;
    } else {
        // If zoomed in, clamp to edges (strict containment)
        const minY = height - scaledHeight;
        const maxY = 0;
        y = Math.min(Math.max(y, minY), maxY);
    }

    return { k, x, y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only drag if mouse is actually down (tracked by ref or buttons)
    if (!isDraggingRef.current && e.buttons !== 1) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    // If moved significantly, consider it a drag
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
       if (!hasDraggedRef.current) {
         hasDraggedRef.current = true;
         setIsDragging(true); // Update UI to grabbing cursor
       }
       
       // Convert screen pixels to SVG coordinates
       // Since the SVG viewBox is set to width/height, and it fills the container,
       // we need to know the scale factor between screen pixels and SVG units.
       // However, if we assume the user is just dragging, the 'dx' and 'dy' in screen pixels
       // might not 1:1 map to SVG units if the SVG is scaled by CSS.
       // But usually for full-screen maps, it's close enough or we can adjust sensitivity.
       // A better way is to use getScreenCTM() but let's stick to simple relative movement for now.
       // To make dragging feel 1:1, we should adjust dx/dy by the ratio of viewBox size to client size.
       
       let scaleFactor = 1;
       if (svgRef.current) {
         const rect = svgRef.current.getBoundingClientRect();
         scaleFactor = width / rect.width; // (SVG Width / Screen Width)
       }

       setTransform(t => clampTransform({
         ...t,
         x: t.x + dx * scaleFactor,
         y: t.y + dy * scaleFactor
       }));
    }
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleGlobalMouseUp = () => {
    isDraggingRef.current = false;
    if (hasDraggedRef.current) {
       setIsDragging(false); // Reset cursor
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent) => {
    // Check if it was a click (no drag)
    if (!hasDraggedRef.current && svgRef.current) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) {
        return;
      }
      const svgPoint = pt.matrixTransform(ctm.inverse());
      const worldX = (svgPoint.x - transform.x) / transform.k;
      const worldY = (svgPoint.y - transform.y) / transform.k;

      let hitId: string | null = null;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (const item of provincePaths) {
          if (ctx.isPointInPath(item.path, worldX, worldY)) {
            hitId = item.id;
            break;
          }
        }

        ctx.restore();
      }

      if (hitId) {
        const settlementId = hitId.startsWith('settlement-') ? hitId : `settlement-${hitId}`;
        if (interactionMode === 'armyMove') {
          const isValid = validTargetSettlementIds && validTargetSettlementIds.includes(settlementId);
          if (isValid && onTargetSelect) {
            onTargetSelect(settlementId);
          }
        } else {
          onProvinceSelect && onProvinceSelect(settlementId);
        }
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Add global mouse up listener to catch drags that leave the SVG
  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Pseudo-random offset generator for winding roads
  const getCurveOffset = (id1: string, id2: string) => {
    const sum = id1.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + 
                id2.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    // Deterministic offset between -15 and 15
    return (sum % 30) - 15;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseScale = Math.min(rect.width / width, rect.height / height);
    const centerX = (rect.width - width * baseScale) / 2;
    const centerY = (rect.height - height * baseScale) / 2;
    const scale = dpr * baseScale * transform.k;
    const tx = dpr * (centerX + baseScale * transform.x);
    const ty = dpr * (centerY + baseScale * transform.y);
    ctx.setTransform(scale, 0, 0, scale, tx, ty);

    for (const item of provincePaths) {
      const fill = getProvinceFill(item.id);
      ctx.fillStyle = fill;
      ctx.strokeStyle = '#5b4630';
      ctx.lineWidth = 1 / transform.k;
      ctx.fill(item.path);
      ctx.stroke(item.path);
    }

    if (riverReady && riverImageRef.current) {
      ctx.drawImage(riverImageRef.current, 0, 0, width, height);
    }

    if (selectedSettlementId) {
      const prefix = 'settlement-';
      const selectedId = selectedSettlementId.startsWith(prefix)
        ? selectedSettlementId.slice(prefix.length)
        : selectedSettlementId;
      const selected = provincePaths.find(p => p.id === selectedId);
      if (selected) {
        ctx.save();
        ctx.lineWidth = 9 / transform.k;
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8 / transform.k;
        ctx.stroke(selected.path);
        ctx.restore();
      }
    }

    if (interactionMode === 'armyMove' && validTargetSettlementIds && validTargetSettlementIds.length > 0) {
      const prefix = 'settlement-';
      const targetIds = new Set<string>();
      validTargetSettlementIds.forEach(id => {
        const shortId = id.startsWith(prefix) ? id.slice(prefix.length) : id;
        targetIds.add(shortId);
      });
      ctx.save();
      ctx.lineWidth = 6 / transform.k;
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([8 / transform.k, 4 / transform.k]);
      for (const item of provincePaths) {
        if (targetIds.has(item.id)) {
          ctx.stroke(item.path);
        }
      }
      ctx.restore();
    }

    const castlePath = new Path2D('M-6 4 L-6 -6 L-4 -6 L-4 -4 L-2 -4 L-2 -6 L0 -6 L0 -4 L2 -4 L2 -6 L4 -6 L4 -4 L6 -4 L6 -6 L6 4 Z');
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#fcd34d';
    ctx.font = `${10 / transform.k}px "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const s of settlements) {
      if (s.terrain === 'water') continue;
      ctx.save();
      ctx.translate(s.position.x, s.position.y);
      ctx.scale(3, 3);
      ctx.fill(castlePath);
      ctx.stroke(castlePath);
      ctx.restore();

      if (transform.k > 2) {
        ctx.fillStyle = '#451a03';
        const name = getSettlementName(s);
        ctx.fillText(name, s.position.x, s.position.y + 24);
      }
    }
  }, [provincePaths, mapData, transform, getProvinceFill, settlements, selectedSettlementId, riverReady, width, height, interactionMode, validTargetSettlementIds]);

  return (
    <div className="w-full h-full bg-antique-dark overflow-hidden relative select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 block"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full h-full block relative ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleSvgMouseUp}
        // @ts-ignore - React TS definition might be missing draggable for SVG
        draggable={false}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {showConnections && settlements.map(s => (
            s.connections.map(conn => {
              const targetId = typeof conn === 'string' ? conn : conn.targetId;
              const type = typeof conn === 'string' ? 'normal' : conn.type;

              if (type === 'disabled') return null;

              const start = s.position;
              const end = settlementPositions.get(targetId);
              if (!end) return null;
              if (s.id > targetId) return null;

              const strokeColor = type === 'river' ? '#06b6d4' : '#5D4037';

              const mx = (start.x + end.x) / 2;
              const my = (start.y + end.y) / 2;

              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = -dy / len;
              const ny = dx / len;

              const offset = getCurveOffset(s.id, targetId);
              const cx = mx + nx * offset;
              const cy = my + ny * offset;

              const pathData = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;

              if (type === 'river') {
                return (
                  <path
                    key={`${s.id}-${targetId}`}
                    d={pathData}
                    stroke={strokeColor}
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    pointerEvents="none"
                  />
                );
              }

              return (
                <path
                  key={`${s.id}-${targetId}`}
                  d={pathData}
                  stroke="#A1887F"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6,4"
                  opacity="0.6"
                  pointerEvents="none"
                />
              );
            })
          ))}
        </g>
      </svg>
    </div>
  );
}
