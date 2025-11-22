// src/components/mui-wrappers/form.tsx
// MUI wrapper para react-hook-form
'use client';

import { FormControl as MuiFormControl, FormLabel as MuiFormLabel, FormHelperText, Box } from '@mui/material';
import { ReactNode } from 'react';
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';

interface FormProps<TFieldValues extends FieldValues> {
  children: ReactNode;
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => void;
}

export function Form<TFieldValues extends FieldValues>({ children, form, onSubmit }: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {children}
      </Box>
    </FormProvider>
  );
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  children: (field: any) => ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ children, ...props }: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      {...props}
      render={({ field }) => children(field)}
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
