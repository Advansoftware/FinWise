// src/components/mui-wrappers/form.tsx
// MUI wrapper para react-hook-form
'use client';

import { FormControl as MuiFormControl, FormLabel as MuiFormLabel, FormHelperText, Box } from '@mui/material';
import { ReactNode } from 'react';
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';

interface FormProps<TFieldValues extends FieldValues> {
  children: ReactNode;
  form?: UseFormReturn<TFieldValues>;
  onSubmit?: (data: TFieldValues) => void;
}

export function Form<TFieldValues extends FieldValues>({ children, form, onSubmit, ...props }: FormProps<TFieldValues> & any) {
  // Se form e onSubmit forem fornecidos, usar FormProvider com form submission
  if (form && onSubmit) {
    return (
      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {children}
        </Box>
      </FormProvider>
    );
  }
  
  // Se apenas form for fornecido (...form spread), simplesmente espalhar os props
  if (props && Object.keys(props).length > 0) {
    return (
      <FormProvider {...props}>
        {children}
      </FormProvider>
    );
  }
  
  // Fallback: apenas renderizar children
  return <>{children}</>;
}

interface FormFieldProps {
  children?: (field: any) => ReactNode;
  render?: (props: any) => ReactNode;
  [key: string]: any;
}

export function FormField({ children, render, ...props }: FormFieldProps) {
  const renderFn = render || ((fieldProps: any) => children?.(fieldProps.field));
  
  return (
    <Controller
      {...props as any}
      render={renderFn}
    />
  );
}

interface FormItemProps {
  children: ReactNode;
}

export function FormItem({ children }: FormItemProps) {
  return <MuiFormControl fullWidth margin="normal">{children}</MuiFormControl>;
}

interface FormLabelProps {
  children: ReactNode;
}

export function FormLabel({ children }: FormLabelProps) {
  return <MuiFormLabel>{children}</MuiFormLabel>;
}

interface FormControlProps {
  children: ReactNode;
}

export function FormControl({ children }: FormControlProps) {
  return <>{children}</>;
}

interface FormMessageProps {
  children?: ReactNode;
}

export function FormMessage({ children }: FormMessageProps) {
  if (!children) return null;
  return <FormHelperText error>{children}</FormHelperText>;
}

interface FormDescriptionProps {
  children: ReactNode;
}

export function FormDescription({ children }: FormDescriptionProps) {
  return <FormHelperText>{children}</FormHelperText>;
}
