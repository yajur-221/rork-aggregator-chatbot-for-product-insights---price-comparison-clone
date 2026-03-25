import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    if (Platform.OS === 'web') {
      // Use web geolocation API
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding for web (mock implementation)
            setLocation({
              latitude,
              longitude,
              city: 'Mumbai', // Mock data
              state: 'Maharashtra',
            });
          } catch (err) {
            setLocation({ latitude, longitude });
          }
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    } else {
      // Use expo-location for mobile
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;

        // Reverse geocoding
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            setLocation({
              latitude,
              longitude,
              city: address.city || address.district || undefined,
              state: address.region || undefined,
            });
          } else {
            setLocation({ latitude, longitude });
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocation({ latitude, longitude });
        }

        setLoading(false);
      } catch (err) {
        console.error('Location request failed:', err);
        setError('Failed to get location');
        setLoading(false);
      }
    }
  };

  return {
    location,
    loading,
    error,
    requestLocation,
  };
}