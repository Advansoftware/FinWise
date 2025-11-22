// MUI-based Label component with Shadcn-compatible API
import * as React from "react";
import { FormLabel, FormLabelProps } from "@mui/material";

export interface LabelProps extends FormLabelProps {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (props, ref) => {
    return (
      <FormLabel
        ref={ref}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          mb: 0.5,
          display: 'block',
          ...props.sx
        }}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";

export { Label };
