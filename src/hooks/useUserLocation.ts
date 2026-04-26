import { useState, useEffect, useCallback } from 'react';

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'zipcode' | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const updateLocationByZip = useCallback(async (zip: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${zip}&countrycodes=us&format=json`);
      const data = await response.json();
      if (data && data.length > 0) {
        setUserLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setLocationSource('zipcode');
        setLocationError(null);
      } else {
        setLocationError("Invalid zip code");
      }
    } catch (error) {
      setLocationError("Failed to fetch location");
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationSource('gps');
        setLocationError(null);
      },
      (err) => {
        console.warn("GPS Access Denied:", err);
        setLocationError("GPS Denied");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distanceLabel = (dist: number) => {
    if (dist < 1) return `${(dist * 1000).toFixed(0)}m`;
    return `${dist.toFixed(1)}km`;
  };

  const openDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return { 
    userLocation, 
    locationSource, 
    locationError, 
    haversineKm, 
    distanceLabel, 
    openDirections, 
    updateLocationByZip 
  };
};
