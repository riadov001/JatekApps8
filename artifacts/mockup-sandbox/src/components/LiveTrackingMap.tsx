import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Truck } from "lucide-react";

const MAP_LIBRARIES: ("geometry" | "places")[] = [];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898 };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a2744" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a1b3d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ba0c0" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#243258" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2744" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d4275" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1f3c" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

interface DriverPing {
  driverId: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  eta: number | null;
  isOnline: boolean;
  orderIds?: number[];
}

interface DriverState extends DriverPing {
  name?: string;
}

const ONLINE_COLOR = "#E91E63";
const OFFLINE_COLOR = "#6b7280";

function makeDriverIcon(isOnline: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: isOnline ? ONLINE_COLOR : OFFLINE_COLOR,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function formatEta(eta: number | null): string {
  if (eta == null) return "Unknown ETA";
  if (eta === 1) return "~1 min";
  return `~${eta} mins`;
}

function timeSince(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

export function LiveTrackingMap({ className }: { className?: string }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    libraries: MAP_LIBRARIES,
    id: "jatek-google-map",
  });

  const [drivers, setDrivers] = useState<Map<number, DriverState>>(new Map());
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseError, setSseError] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jatek_backend_token");
    const url = token
      ? `/api/events?channels=admin_tracking&token=${encodeURIComponent(token)}`
      : `/api/events?channels=admin_tracking`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setSseConnected(true);
      setSseError(false);
    });

    es.addEventListener("driver_location", (e) => {
      const ping: DriverPing = JSON.parse((e as MessageEvent).data);
      setDrivers((prev) => {
        const next = new Map(prev);
        const existing = next.get(ping.driverId);
        next.set(ping.driverId, { ...ping, name: existing?.name });
        return next;
      });
    });

    es.addEventListener("driver_offline", (e) => {
      const payload: { driverId: number; lastSeen: number } = JSON.parse((e as MessageEvent).data);
      setDrivers((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.driverId);
        if (existing) {
          next.set(payload.driverId, { ...existing, isOnline: false, timestamp: payload.lastSeen });
        }
        return next;
      });
    });

    es.onerror = () => {
      setSseConnected(false);
      setSseError(true);
    };

    tickRef.current = setInterval(() => {
      setDrivers((prev) => new Map(prev));
    }, 5000);

    return () => {
      es.close();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const onlineCount = [...drivers.values()].filter((d) => d.isOnline).length;

  if (!apiKey) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Live Driver Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY)
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Live Driver Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-destructive text-sm">
            Failed to load Google Maps: {loadError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Live Driver Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            {sseError ? (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <WifiOff className="h-3 w-3" /> Disconnected
              </Badge>
            ) : sseConnected ? (
              <Badge className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-600">
                <Wifi className="h-3 w-3" /> Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Connecting…
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {onlineCount} online / {drivers.size} tracked
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <div className="h-[420px] w-full">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={DEFAULT_CENTER}
              zoom={12}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {[...drivers.values()].map((driver) => (
                <Marker
                  key={driver.driverId}
                  position={{ lat: driver.latitude, lng: driver.longitude }}
                  icon={makeDriverIcon(driver.isOnline)}
                  title={`Driver #${driver.driverId}`}
                  onClick={() =>
                    setSelectedDriver(
                      selectedDriver === driver.driverId ? null : driver.driverId
                    )
                  }
                />
              ))}

              {selectedDriver != null && drivers.has(selectedDriver) && (() => {
                const d = drivers.get(selectedDriver)!;
                return (
                  <InfoWindow
                    position={{ lat: d.latitude, lng: d.longitude }}
                    onCloseClick={() => setSelectedDriver(null)}
                  >
                    <div className="text-sm space-y-1 min-w-[140px]">
                      <p className="font-semibold text-gray-900">Driver #{d.driverId}</p>
                      <p className={d.isOnline ? "text-green-600" : "text-gray-500"}>
                        {d.isOnline ? "Online" : "Offline"}
                      </p>
                      <p className="text-gray-700">{formatEta(d.eta)}</p>
                      {d.orderIds && d.orderIds.length > 0 && (
                        <p className="text-gray-500 text-xs">
                          Orders: #{d.orderIds.join(", #")}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">{timeSince(d.timestamp)}</p>
                    </div>
                  </InfoWindow>
                );
              })()}
            </GoogleMap>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted animate-pulse">
              <span className="text-muted-foreground text-sm">Loading map…</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
