import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken='pk.eyJ1IjoiYWFyem9vbWVodGEiLCJhIjoiY201Z3phcjRoMDljbDJqc2Q3bGpjbThudyJ9.ipRx2wCjknbZQwhaelxv6g';

const MapPicker = ({ onSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.5946, 12.9716], // [lng, lat]
      zoom: 12
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true,
      placeholder: 'Search for a location...'
    });

    map.current.addControl(geocoder);

    geocoder.on('result', (e) => {
      const { center, place_name } = e.result;
      if (onSelect) onSelect({ lat: center[1], lng: center[0], name: place_name });
    });

  }, [onSelect]);

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '12px' }} ref={mapContainer} />
  );
};

export default MapPicker;
