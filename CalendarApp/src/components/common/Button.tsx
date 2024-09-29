import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ButtonProps extends MuiButtonProps {
    fullWidth?: boolean;
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, fullWidth }) => ({
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    width: fullWidth ? '100%' : 'auto',
}));

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
    return <StyledButton {...props}>{children}</StyledButton>;
};

export default Button;
