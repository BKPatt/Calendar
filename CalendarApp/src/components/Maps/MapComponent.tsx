import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface MapComponentProps {
    address: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ address }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const googleMapScript = document.createElement('script');
        googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        googleMapScript.async = true;
        googleMapScript.defer = true;
        window.document.body.appendChild(googleMapScript);

        googleMapScript.addEventListener('load', () => {
            setMapLoaded(true);
        });

        return () => {
            window.document.body.removeChild(googleMapScript);
        };
    }, []);

    useEffect(() => {
        if (mapLoaded && mapRef.current) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                    const mapElement = mapRef.current;
                    if (mapElement) {
                        const map = new window.google.maps.Map(mapElement, {
                            center: results[0].geometry.location,
                            zoom: 15,
                        });

                        new window.google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location,
                        });
                    }
                } else {
                    setError('Failed to load the map. Please check the address.');
                }
            });
        }
    }, [mapLoaded, address]);

    if (error) {
        return (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
            {!mapLoaded && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </Box>
    );
};

export default MapComponent;
