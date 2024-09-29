import React from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/system';
import { TextFieldProps } from '@mui/material/TextField';

type InputProps = TextFieldProps & {
    fullWidth?: boolean;
};

const StyledTextField = styled(TextField)<InputProps>(({ theme, fullWidth }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 8,
    },
    width: fullWidth ? '100%' : 'auto',
}));

const Input: React.FC<InputProps> = ({ fullWidth = false, ...props }) => {
    return (
        <StyledTextField
            fullWidth={fullWidth}
            {...props}
            variant="outlined"
        />
    );
};

export default Input;