// MUI-based Command component (Autocomplete) with Shadcn-compatible API
import * as React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  TextField,
  Typography,
} from "@mui/material";

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <Box ref={ref} sx={{ width: '100%' }} {...props}>
        {children}
      </Box>
    );
  }
);

Command.displayName = "Command";

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        size="small"
        fullWidth
        sx={{ mb: 1 }}
        {...props}
      />
    );
  }
);

CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <List ref={ref} sx={{ maxHeight: 300, overflow: 'auto' }} {...props}>
        {children}
      </List>
    );
  }
);

CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <Box ref={ref} sx={{ p: 2, textAlign: 'center' }} {...props}>
        <Typography variant="body2" color="text.secondary">
          {children}
        </Typography>
      </Box>
    );
  }
);

CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <Box ref={ref} {...props}>
        {children}
      </Box>
    );
  }
);

CommandGroup.displayName = "CommandGroup";

const CommandItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }>(
  ({ children, onSelect, ...props }, ref) => {
    return (
      <ListItem disablePadding ref={ref}>
        <ListItemButton onClick={onSelect} {...props}>
          {children}
        </ListItemButton>
      </ListItem>
    );
  }
);

CommandItem.displayName = "CommandItem";

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
