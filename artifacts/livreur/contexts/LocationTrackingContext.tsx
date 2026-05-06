import * as Location from "expo-location";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import {
  updateDriver,
  updateDriverLocation,
} from "@workspace/api-client-react";

import { useAuth } from "./AuthContext";

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationTrackingValue {
  online: boolean;
  coords: Coords | null;
  permissionDenied: boolean;
  toggling: boolean;
  setOnline: (next: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshOnce: () => Promise<Coords | null>;
}

const Ctx = createContext<LocationTrackingValue | null>(null);

export function LocationTrackingProvider({ children }: { children: ReactNode }) {
  const { driverId, driver } = useAuth();
  const [online, setOnlineState] = useState<boolean>(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  // Sync initial online state from server-side isAvailable.
  useEffect(() => {
    if (driver) setOnlineState(!!driver.isAvailable);
  }, [driver?.id, driver?.isAvailable]);

  const stopWatcher = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      // Web geolocation prompt happens on first getCurrentPositionAsync call.
      return true;
    }
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPermissionDenied(!canAskAgain || status === "denied");
      return false;
    }
    setPermissionDenied(false);
    return true;
  }, []);

  const broadcast = useCallback(
    async (c: Coords) => {
      if (!driverId) return;
      try {
        await updateDriverLocation(driverId, {
          latitude: c.latitude,
          longitude: c.longitude,
        });
      } catch {
        // network errors are non-fatal — next tick will retry
      }
    },
    [driverId],
  );

  const startWatcher = useCallback(async () => {
    stopWatcher();
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setCoords(c);
            broadcast(c);
          },
          () => setPermissionDenied(true),
          { enableHighAccuracy: true, maximumAge: 5000 },
        );
        watcherRef.current = {
          remove: () => navigator.geolocation.clearWatch(id),
        } as Location.LocationSubscription;
      }
      return;
    }
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(c);
        broadcast(c);
      },
    );
    watcherRef.current = sub;
  }, [broadcast, stopWatcher]);

  const refreshOnce = useCallback(async (): Promise<Coords | null> => {
    const ok = await requestPermission();
    if (!ok) return null;
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setCoords(c);
            resolve(c);
          },
          () => resolve(null),
          { enableHighAccuracy: true },
        );
      });
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    setCoords(c);
    return c;
  }, [requestPermission]);

  const setOnline = useCallback(
    async (next: boolean) => {
      if (!driverId) return;
      setToggling(true);
      try {
        if (next) {
          const ok = await requestPermission();
          if (!ok) {
            setOnlineState(false);
            return;
          }
          try {
            await updateDriver(driverId, { isAvailable: true });
          } catch {
            // ignore — we'll still try to broadcast
          }
          setOnlineState(true);
          await startWatcher();
        } else {
          stopWatcher();
          try {
            await updateDriver(driverId, { isAvailable: false });
          } catch {
            // ignore
          }
          setOnlineState(false);
        }
      } finally {
        setToggling(false);
      }
    },
    [driverId, requestPermission, startWatcher, stopWatcher],
  );

  // Auto-start the watcher if we are already online (e.g. after relogin).
  useEffect(() => {
    if (online && driverId && !watcherRef.current) {
      (async () => {
        const ok = await requestPermission();
        if (ok) await startWatcher();
      })();
    }
    return () => {
      // do not stop watcher on every render; only on unmount
    };
  }, [online, driverId, requestPermission, startWatcher]);

  useEffect(() => {
    return () => stopWatcher();
  }, [stopWatcher]);

  const value = useMemo<LocationTrackingValue>(
    () => ({
      online,
      coords,
      permissionDenied,
      toggling,
      setOnline,
      requestPermission,
      refreshOnce,
    }),
    [online, coords, permissionDenied, toggling, setOnline, requestPermission, refreshOnce],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocationTracking(): LocationTrackingValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocationTracking must be used within LocationTrackingProvider");
  return v;
}
