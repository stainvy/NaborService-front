import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PenLine } from 'lucide-react';

// Fix default marker icon (vite bundling)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error — _getIconUrl is private but needed for vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export interface ExistingPolygon {
  pgId: string;
  name: string;
  geojson: GeoJSON.Polygon;
}

interface NeighbourhoodMapProps {
  geojson?: GeoJSON.Polygon;
  centroid?: { latitude: number; longitude: number };
  height?: string;
  drawMode?: boolean;
  onPolygonDrawn?: (geojson: GeoJSON.Polygon) => void;
  /** Existing neighbourhoods to display as reference when drawing. */
  existingPolygons?: ExistingPolygon[];
}

// ─── Snapping ───

const SNAP_THRESHOLD_M = 50; // meters
const METERS_PER_DEG_LAT = 111_320;

/** Finds the closest existing vertex within threshold, or returns the click point. */
function snapPoint(
  lat: number,
  lng: number,
  existingVertices: { lat: number; lng: number }[],
): { lat: number; lng: number; snapped: boolean } {
  let best = { lat, lng, snapped: false };
  let bestDist = Infinity;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (const v of existingVertices) {
    const dLatM = (v.lat - lat) * METERS_PER_DEG_LAT;
    const dLngM = (v.lng - lng) * METERS_PER_DEG_LAT * cosLat;
    const dist = Math.sqrt(dLatM * dLatM + dLngM * dLngM);
    if (dist < SNAP_THRESHOLD_M && dist < bestDist) {
      best = { lat: v.lat, lng: v.lng, snapped: true };
      bestDist = dist;
    }
  }
  return best;
}

// ─── Sub-components ───

function FitBounds({ geojson, existing }: { geojson?: GeoJSON.Polygon; existing?: ExistingPolygon[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    let hasCoords = false;
    if (geojson?.coordinates?.[0]?.length) {
      for (const [lng, lat] of geojson.coordinates[0] as [number, number][]) {
        bounds.extend([lat, lng]);
        hasCoords = true;
      }
    }
    if (existing?.length) {
      for (const ep of existing) {
        if (ep.geojson?.coordinates?.[0]?.length) {
          for (const [lng, lat] of ep.geojson.coordinates[0] as [number, number][]) {
            bounds.extend([lat, lng]);
            hasCoords = true;
          }
        }
      }
    }
    if (hasCoords) map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, geojson, existing]);
  return null;
}

function DrawHandler({
  active,
  onAddPoint,
  existingVertices,
}: {
  active: boolean;
  onAddPoint: (latlng: [number, number], snapped: boolean) => void;
  existingVertices: { lat: number; lng: number }[];
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      const snap = snapPoint(e.latlng.lat, e.latlng.lng, existingVertices);
      onAddPoint([snap.lat, snap.lng], snap.snapped);
    },
  });
  return null;
}

// ─── Helpers ───

function pointsToGeoJSON(points: [number, number][]): GeoJSON.Polygon {
  const ring = points.map(([lat, lng]) => [lng, lat] as [number, number]);
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([...first] as [number, number]);
    }
  }
  return { type: 'Polygon', coordinates: [ring] };
}

function geoJsonToLatLngs(geojson: GeoJSON.Polygon): [number, number][] {
  if (!geojson?.coordinates?.[0]) return [];
  return (geojson.coordinates[0] as [number, number][]).map(([lng, lat]) => [lat, lng]);
}

/** Collect all vertices from all existing polygons for snapping. */
function collectVertices(existing: ExistingPolygon[]): { lat: number; lng: number }[] {
  const verts: { lat: number; lng: number }[] = [];
  for (const ep of existing) {
    const ring = ep.geojson?.coordinates?.[0];
    if (!ring) continue;
    for (const [lng, lat] of ring as [number, number][]) {
      verts.push({ lat, lng });
    }
  }
  return verts;
}

// ─── Main ───

export function NeighbourhoodMap({
  geojson,
  centroid,
  height = '300px',
  drawMode = false,
  onPolygonDrawn,
  existingPolygons,
}: NeighbourhoodMapProps) {
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [snapHint, setSnapHint] = useState<[number, number] | null>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout>>();

  const existingVertices = useMemo(
    () => (drawMode ? collectVertices(existingPolygons ?? []) : []),
    [drawMode, existingPolygons],
  );

  const startDrawing = useCallback(() => {
    setDrawPoints([]);
    setDrawing(true);
  }, []);

  const finishDrawing = useCallback(() => {
    if (drawPoints.length < 3) return;
    const polygon = pointsToGeoJSON(drawPoints);
    onPolygonDrawn?.(polygon);
    setDrawing(false);
    setDrawPoints([]);
  }, [drawPoints, onPolygonDrawn]);

  const clearDrawing = useCallback(() => {
    setDrawPoints([]);
    setDrawing(false);
  }, []);

  const addPoint = useCallback(
    (latlng: [number, number], snapped: boolean) => {
      if (!drawing) return;
      setDrawPoints((prev) => [...prev, latlng]);
      if (snapped) {
        setSnapHint(latlng);
        if (snapTimer.current) clearTimeout(snapTimer.current);
        snapTimer.current = setTimeout(() => setSnapHint(null), 800);
      }
    },
    [drawing],
  );

  useEffect(() => () => { if (snapTimer.current) clearTimeout(snapTimer.current); }, []);

  const displayPositions = useMemo(() => geoJsonToLatLngs(geojson!), [geojson]);
  const drawPositions = useMemo(() => drawPoints, [drawPoints]);

  // Convert existing polygons for display
  const existingPolys = useMemo(() => existingPolygons?.map(ep => ({ ...ep, positions: geoJsonToLatLngs(ep.geojson) })) ?? [], [existingPolygons]);

  const center: [number, number] = useMemo(() => {
    if (centroid) return [centroid.latitude, centroid.longitude];
    if (geojson?.coordinates?.[0]?.[0]) {
      const [lng, lat] = geojson.coordinates[0][0] as [number, number];
      return [lat, lng];
    }
    return [48.8566, 2.3522];
  }, [geojson, centroid]);

  return (
    <div className="flex flex-col gap-2">
      <div style={{ height }} className="overflow-hidden rounded-lg border border-admin-border">
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Existing neighbourhoods (reference, always shown) */}
          {existingPolys.map((ep) => (
            <Polygon
              key={ep.pgId}
              positions={ep.positions}
              pathOptions={{ color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.08, weight: 1.5 }}
            >
              <Popup>{ep.name}</Popup>
            </Polygon>
          ))}

          {/* Preview polygon (when editing / pasted GeoJSON) */}
          {displayPositions.length > 0 && !drawing && (
            <Polygon positions={displayPositions} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15, weight: 2 }}>
              <Popup>Polygone du quartier</Popup>
            </Polygon>
          )}

          {/* In-progress drawing polygon */}
          {drawPositions.length >= 3 && drawing && (
            <Polygon positions={drawPositions} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2, dashArray: '6 3' }}>
              <Popup>Polygone en cours</Popup>
            </Polygon>
          )}

          {/* Drawing vertices + snap hint */}
          {drawPositions.map((pos, i) => (
            <Marker key={i} position={pos}>
              <Popup>Point {i + 1}</Popup>
            </Marker>
          ))}
          {snapHint && (
            <Circle center={snapHint} radius={SNAP_THRESHOLD_M} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.3, weight: 2 }} />
          )}

          {/* Centroid (only when not drawing) */}
          {centroid && !drawing && (
            <Marker position={[centroid.latitude, centroid.longitude]}>
              <Popup>Centroïde</Popup>
            </Marker>
          )}

          <DrawHandler active={drawing} onAddPoint={addPoint} existingVertices={existingVertices} />
          <FitBounds geojson={geojson} existing={drawMode ? existingPolygons : undefined} />
        </MapContainer>
      </div>

      {drawMode && (
        <div className="flex items-center gap-2">
          {!drawing ? (
            <button type="button" onClick={startDrawing} className="flex items-center gap-1.5 rounded border border-green-400 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
              <PenLine className="h-3.5 w-3.5" /> Dessiner un polygone
            </button>
          ) : (
            <>
              <span className="text-xs text-admin-muted">
                {drawPoints.length} point{drawPoints.length > 1 ? 's' : ''}, cliquez sur la carte
                {snapHint && <span className="ml-1 font-medium text-green-600">(accroché !)</span>}
              </span>
              <button type="button" onClick={finishDrawing} disabled={drawPoints.length < 3} className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40">
                Terminer
              </button>
              <button type="button" onClick={clearDrawing} className="rounded border border-admin-border px-3 py-1.5 text-xs text-admin-muted hover:bg-admin-bg">
                Annuler
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
