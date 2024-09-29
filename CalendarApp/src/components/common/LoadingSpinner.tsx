import React from 'react';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { CircularProgressProps } from '@mui/material/CircularProgress';

interface LoadingSpinnerProps extends CircularProgressProps {
    size?: number;
}

const SpinnerContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
});

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, ...props }) => {
    return (
        <SpinnerContainer>
            <CircularProgress
                {...props}
                size={size}
            />
        </SpinnerContainer>
    );
};

export default LoadingSpinner;