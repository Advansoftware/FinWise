// src/components/camera/file-upload.tsx
"use client";

import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, FileImage } from "lucide-react";
import { Box, Typography, type SxProps, type Theme } from '@mui/material';

interface FileUploadProps {
  onFileSelect: (imageData: string) => void;
  accept?: string;
  sx?: SxProps<Theme>;
  variant?: 'dropzone' | 'button';
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  sx,
  variant = 'dropzone'
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG) ou PDF.');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        onFileSelect(reader.result as string);
      }
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  if (variant === 'button') {
    return (
      <>
        <Button 
          variant="outline" 
          sx={{ width: '100%', ...sx }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} /> 
          Enviar da Galeria
        </Button>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept={accept} 
          style={{ display: 'none' }}
          onChange={handleFileChange} 
        />
      </>
    );
  }

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '16rem',
          border: '2px dashed',
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderColor: isDragOver ? 'primary.main' : theme => `${theme.palette.primary.main}4D`,
          bgcolor: isDragOver ? theme => `${theme.palette.primary.main}1A` : theme => (theme.palette as any).custom?.muted,
          '&:hover': {
            bgcolor: isDragOver ? undefined : theme => `${(theme.palette as any).custom?.muted}CC`
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 2.5, pb: 3 }}>
          {isDragOver ? (
            <FileImage style={{ width: '2rem', height: '2rem', marginBottom: '1rem', color: 'currentColor', animation: 'bounce 1s infinite' }} />
          ) : (
            <Upload style={{ width: '2rem', height: '2rem', marginBottom: '1rem', color: 'currentColor' }} />
          )}
          <Typography sx={{ mb: 1, fontSize: '0.875rem', color: 'text.primary' }}>
            <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isDragOver ? 'Solte o arquivo aqui' : 'Clique para enviar'}
            </Box>
            {!isDragOver && ' ou arraste e solte'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: theme => (theme.palette as any).custom?.mutedForeground }}>
            PNG, JPG ou PDF (máx. 10MB)
          </Typography>
        </Box>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept={accept} 
          style={{ display: 'none' }}
          onChange={handleFileChange} 
        />
      </Box>
    </Box>
  );
}