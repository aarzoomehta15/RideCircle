import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

const MapPicker = ({
  onLocationSelect,
  defaultLocation,
  label = "Select Location",
}) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeMap = useCallback(async () => {
    try {
      const loader = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();

      const center = defaultLocation || { lat: 30.7333, lng: 76.7794 }; // Chandigarh default

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        draggable: true,
        position: center,
      });

      // Autocomplete
      if (inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: { country: "in" },
            fields: ["formatted_address", "geometry", "name"],
          }
        );

        autocomplete.bindTo("bounds", mapInstance);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError("No details available for input: " + place.name);
            return;
          }

          const location = {
            address: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(15);
          markerInstance.setPosition(place.geometry.location);

          setSelectedLocation(location);
          onLocationSelect(location);
        });
      }

      // Marker drag
      markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition();
        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: position }, (results, status) => {
          if (status === "OK" && results[0]) {
            const location = {
              address: results[0].formatted_address,
              lat: position.lat(),
              lng: position.lng(),
            };

            setSelectedLocation(location);
            onLocationSelect(location);
            if (inputRef.current) {
              inputRef.current.value = results[0].formatted_address;
            }
          }
        });
      });
      setMap(mapInstance);
      setMarker(markerInstance);
      setLoading(false);
    } catch (err) {
      console.error("Error loading map:", err);
      setError("Failed to load map. Please check your API key.");
      setLoading(false);
    }
  }, [defaultLocation, onLocationSelect]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <MapPin size={16} className="inline mr-2" />
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a location..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      {loading && (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div
        ref={mapRef}
        className={`w-full h-96 rounded-lg border border-gray-300 ${
          loading ? "hidden" : ""
        }`}
      />

      {selectedLocation && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <MapPin size={14} className="inline mr-1" />
            Selected: {selectedLocation.address}
          </p>
        </div>
      )}
    </div>
  );
};
export default MapPicker;
