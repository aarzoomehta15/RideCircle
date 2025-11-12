// import React, { useEffect, useRef } from 'react';
// import mapboxgl from 'mapbox-gl';
// import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// mapboxgl.accessToken='pk.eyJ1IjoiYWFyem9vbWVodGEiLCJhIjoiY201Z3phcjRoMDljbDJqc2Q3bGpjbThudyJ9.ipRx2wCjknbZQwhaelxv6g';

// const MapPicker = ({ onSelect }) => {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   useEffect(() => {
//     if (map.current) return; // initialize only once

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: 'mapbox://styles/mapbox/streets-v11',
//       center: [77.5946, 12.9716], // [lng, lat]
//       zoom: 12
//     });

//     const geocoder = new MapboxGeocoder({
//       accessToken: mapboxgl.accessToken,
//       mapboxgl: mapboxgl,
//       marker: true,
//       placeholder: 'Search for a location...'
//     });

//     map.current.addControl(geocoder);

//     geocoder.on('result', (e) => {
//       const { center, place_name } = e.result;
//       if (onSelect) onSelect({ lat: center[1], lng: center[0], name: place_name });
//     });

//   }, [onSelect]);

//   return (
//     <div style={{ width: '100%', height: '400px', borderRadius: '12px' }} ref={mapContainer} />
//   );
// };

// export default MapPicker;


import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoiYWFyem9vbWVodGEiLCJhIjoiY201Z3phcjRoMDljbDJqc2Q3bGpjbThudyJ9.ipRx2wCjknbZQwhaelxv6g';

// Helper function to perform reverse geocoding
const reverseGeocode = async (lng, lat) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&types=place,locality,neighborhood,address,poi&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Get the first, most relevant result's name
      return data.features[0].place_name;
    }
  } catch (error) {
    console.error('Reverse Geocoding failed:', error);
  }
  return `Custom Location (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;
};

const MapPicker = ({ onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Function to handle the final location selection (called on dragend or initialization)
  const handleLocationUpdate = async (lngLat) => {
    const lat = lngLat.lat;
    const lng = lngLat.lng;
    const address = await reverseGeocode(lng, lat);

    if (onLocationSelect) {
      onLocationSelect({ lat, lng, address });
    }
  };

  useEffect(() => {
    if (map.current) return; // initialize only once

    // Using coordinates for Patiala (Punjab, India) for a better local starting point
    const initialCenter = [76.3686, 30.3398]; // [lng, lat]

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: initialCenter,
      zoom: 14, // Increased default zoom for more detail
    });

    // 1. Add Draggable Marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#4F46E5', // Indigo-600
    })
      .setLngLat(initialCenter)
      .addTo(map.current);
    
    // Immediately select the initial location
    handleLocationUpdate(marker.current.getLngLat());

    // 2. Geocoder Control (for searching)
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false, // Do not use the geocoder's default marker
      placeholder: 'Search for a location...',
      // Broaden types to include places and points of interest (poi) for detailed locations
      types: 'place,locality,neighborhood,address,poi',
      // Add proximity to prioritize local results
      proximity: { longitude: initialCenter[0], latitude: initialCenter[1] },
    });

    map.current.addControl(geocoder, 'top-left');

    // Handle search result selection - ONLY moves the map and pin, does NOT update the form input directly.
    geocoder.on('result', (e) => {
      const { center } = e.result;
      const lng = center[0];
      const lat = center[1];
      
      const newZoom = 16; // Very detailed zoom level

      // Move draggable marker to search result location and fly to it
      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({ center: [lng, lat], zoom: newZoom });
      
      // Update the form to the new location selected by the search (as if the user dragged it there)
      handleLocationUpdate(marker.current.getLngLat()); 
    });

    // 3. Handle Marker Drag End (This is the definitive source of the address)
    const onDragEnd = () => {
      handleLocationUpdate(marker.current.getLngLat());
    };

    marker.current.on('dragend', onDragEnd);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onLocationSelect]);

  return (
    <div
      style={{ width: '100%', height: '400px', borderRadius: '12px' }}
      ref={mapContainer}
    />
  );
};

export default MapPicker;