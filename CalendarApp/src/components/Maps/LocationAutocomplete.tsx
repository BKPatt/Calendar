import React, { useEffect, useRef, useState } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import { AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material/useAutocomplete';

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    error?: boolean;
    helperText?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
    value,
    onChange,
    required = false,
    error = false,
    helperText = '',
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [options, setOptions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);

    useEffect(() => {
        const googleMapScript = document.createElement('script');
        googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API}&libraries=places`;
        googleMapScript.async = true;
        googleMapScript.defer = true;
        window.document.body.appendChild(googleMapScript);

        googleMapScript.addEventListener('load', () => {
            setScriptLoaded(true);
        });

        return () => {
            window.document.body.removeChild(googleMapScript);
        };
    }, []);

    useEffect(() => {
        if (scriptLoaded) {
            autocompleteService.current = new google.maps.places.AutocompleteService();
            placesService.current = new google.maps.places.PlacesService(document.createElement('div'));
        }
    }, [scriptLoaded]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);

        if (!event.target.value) {
            setOptions([]);
            return;
        }

        setLoading(true);
        autocompleteService.current?.getPlacePredictions(
            { input: event.target.value },
            (predictions) => {
                if (predictions) {
                    setOptions(predictions);
                }
                setLoading(false);
            }
        );
    };

    const handleOptionSelect = (
        event: React.SyntheticEvent,
        value: string | google.maps.places.AutocompletePrediction | null,
        reason: AutocompleteChangeReason,
        details?: AutocompleteChangeDetails<google.maps.places.AutocompletePrediction> | undefined
    ) => {
        if (typeof value === 'string') {
            setInputValue(value);
            onChange(value);
        } else if (value) {
            placesService.current?.getDetails(
                { placeId: value.place_id },
                (place) => {
                    if (place && place.formatted_address) {
                        setInputValue(place.formatted_address);
                        onChange(place.formatted_address);
                    }
                }
            );
        } else {
            setInputValue('');
            onChange('');
        }
    };

    if (!scriptLoaded) {
        return <CircularProgress />;
    }

    return (
        <Autocomplete
            freeSolo
            options={options}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.description}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={handleOptionSelect}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Location"
                    variant="outlined"
                    fullWidth
                    required={required}
                    error={error}
                    helperText={helperText}
                    onChange={handleInputChange}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <React.Fragment>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </React.Fragment>
                            ),
                        },
                    }}
                />
            )}
        />
    );
};

export default LocationAutocomplete;
