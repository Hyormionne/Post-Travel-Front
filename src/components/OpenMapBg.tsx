'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { INK, INK_SOFT, FONT_HAND } from '../theme/tokens';

export interface OpenMapPin {
  lat: number;
  lng: number;
  label?: string;
  pending?: boolean;
}

interface OpenMapBgProps {
  pins: OpenMapPin[];
  center?: [lng: number, lat: number];
  zoom?: number;
  onPinClick?: (index: number) => void;
}

// Design-token palette for overriding Shortbread vector layers
const C = {
  land:      '#eee8db',
  land2:     '#e8e2d4',
  water:     '#aec4d4',
  waterLow:  'rgba(174,196,212,0.55)',
  green:     '#bfccb2',
  greenDark: '#a5b596',
  building:  '#dbd4c2',
  buildingOutline: 'rgba(44,38,32,0.15)',
  roadCase:  'rgba(44,38,32,0.10)',
  roadFill:  '#e4dcc8',
  roadMajor: '#d4ccb8',
  text:      '#2c2620',
  textHalo:  'rgba(246,241,230,0.88)',
  boundary:  'rgba(44,38,32,0.22)',
};

function applyPaperTheme(map: maplibregl.Map) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    const type = layer.type;
    try {
      if (type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', C.land);
      } else if (type === 'fill') {
        if (id.includes('water') || id.includes('ocean') || id.includes('lake') || id.includes('river')) {
          map.setPaintProperty(layer.id, 'fill-color', C.water);
          map.setPaintProperty(layer.id, 'fill-opacity', 0.7);
        } else if (id.includes('forest') || id.includes('wood') || id.includes('tree')) {
          map.setPaintProperty(layer.id, 'fill-color', C.greenDark);
          map.setPaintProperty(layer.id, 'fill-opacity', 0.5);
        } else if (
          id.includes('grass') || id.includes('park') || id.includes('garden') ||
          id.includes('green') || id.includes('farm') || id.includes('meadow') ||
          id.includes('landuse') || id.includes('landcover') || id.includes('scrub')
        ) {
          map.setPaintProperty(layer.id, 'fill-color', C.green);
          map.setPaintProperty(layer.id, 'fill-opacity', 0.45);
        } else if (id.includes('building')) {
          map.setPaintProperty(layer.id, 'fill-color', C.building);
          map.setPaintProperty(layer.id, 'fill-outline-color', C.buildingOutline);
        } else if (id.includes('sand') || id.includes('beach') || id.includes('bare')) {
          map.setPaintProperty(layer.id, 'fill-color', '#e2d9c0');
        } else if (id.includes('ice') || id.includes('glacier') || id.includes('snow')) {
          map.setPaintProperty(layer.id, 'fill-color', '#ece8e0');
        } else {
          // generic land fill
          map.setPaintProperty(layer.id, 'fill-color', C.land2);
          map.setPaintProperty(layer.id, 'fill-opacity', 0.4);
        }
      } else if (type === 'line') {
        if (id.includes('water') || id.includes('river') || id.includes('stream')) {
          map.setPaintProperty(layer.id, 'line-color', C.water);
        } else if (id.includes('boundary') || id.includes('border') || id.includes('admin')) {
          map.setPaintProperty(layer.id, 'line-color', C.boundary);
          map.setPaintProperty(layer.id, 'line-dasharray', [3, 2]);
        } else if (id.includes('motorway') || id.includes('trunk') || id.includes('primary')) {
          map.setPaintProperty(layer.id, 'line-color', id.includes('case') || id.includes('outline') ? C.roadCase : C.roadMajor);
        } else if (id.includes('road') || id.includes('street') || id.includes('path') || id.includes('rail') || id.includes('transit')) {
          map.setPaintProperty(layer.id, 'line-color', id.includes('case') || id.includes('outline') ? C.roadCase : C.roadFill);
        }
      } else if (type === 'symbol') {
        // labels
        try { map.setPaintProperty(layer.id, 'text-color', C.text); } catch { /* no text layer */ }
        try { map.setPaintProperty(layer.id, 'text-halo-color', C.textHalo); } catch { /* no halo */ }
        try { map.setPaintProperty(layer.id, 'icon-opacity', 0.6); } catch { /* no icon */ }
      }
    } catch {
      // skip layers that don't support a given property
    }
  }
}

function makePinEl(label: string | undefined, pending: boolean | undefined): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'yh-thumbpin';
  wrap.style.cssText = 'width:32px;height:32px;';
  wrap.innerHTML = `
    <div style="
      width:32px;height:32px;border-radius:50% 50% 50% 8%;
      transform:rotate(-45deg);
      background:${pending ? 'transparent' : '#d8c9a5'};
      border:${pending ? '1.2px dashed' : '1.4px solid'} ${INK};
      box-shadow:0 4px 10px rgba(44,38,32,0.22);
      position:relative;overflow:hidden;
    ">
      <div style="
        position:absolute;inset:0;transform:rotate(45deg);
        display:flex;align-items:center;justify-content:center;
        font-family:${FONT_HAND};font-size:14px;color:${INK_SOFT};
      ">${pending ? '...' : (label ?? '✦')}</div>
    </div>
  `;
  return wrap;
}

export function OpenMapBg({ pins, center = [134, 38.5], zoom = 5, onPinClick }: OpenMapBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
      center,
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      applyPaperTheme(map);

      pins.forEach((p, i) => {
        const el = makePinEl(p.label, p.pending);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onPinClick?.(i);
        });
        new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
}
