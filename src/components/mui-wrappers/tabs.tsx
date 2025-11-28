// src/components/mui-wrappers/tabs.tsx
// MUI wrapper para Tabs
'use client';

import { Tabs as MuiTabs, Tab as MuiTab, Box } from '@mui/material';
import { ReactNode, useState, Children, isValidElement, cloneElement } from 'react';

export function Tabs({ 
  children, 
  defaultValue, 
  value: controlledValue, 
  onValueChange,
  ...props
}: { 
  children: ReactNode; 
  defaultValue?: string; 
  value?: string;
  onValueChange?: (value: string) => void;
  [key: string]: any;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const value = controlledValue ?? internalValue;
  
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  // Extract TabsList and TabsContent children
  const childrenArray = Children.toArray(children);
  const tabsList = childrenArray.find(child => isValidElement(child) && child.type === TabsList);
  const tabsContents = childrenArray.filter(child => isValidElement(child) && child.type === TabsContent);

  return (
    <Box sx={{ width: '100%' }}>
      {tabsList && isValidElement(tabsList) && cloneElement(tabsList as any, { value, onChange: handleChange })}
      {tabsContents.map((content) => 
        isValidElement(content) ? cloneElement(content as any, { key: (content.props as any).value, activeValue: value }) : content
      )}
    </Box>
  );
}

export function TabsList({ children, value, onChange, ...props }: { 
  children: ReactNode; 
  value?: string;
  onChange?: (event: React.SyntheticEvent, newValue: string) => void;
  [key: string]: any;
}) {
  return (
    <MuiTabs 
      value={value} 
      onChange={onChange}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      {children}
    </MuiTabs>
  );
}

export function TabsTrigger({ value, children, ...props }: { value: string; children: ReactNode; [key: string]: any }) {
  return <MuiTab value={value} label={children} />;
}

export function TabsContent({ value, activeValue, children, ...props }: { 
  value: string; 
  activeValue?: string;
  children: ReactNode;
  [key: string]: any;
}) {
  if (activeValue !== value) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}
