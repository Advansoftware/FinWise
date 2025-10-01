// src/components/camera/file-upload.tsx
"use client";

import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (imageData: string) => void;
  accept?: string;
  className?: string;
  variant?: 'dropzone' | 'button';
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  className,
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
          className={cn("w-full", className)}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" /> 
          Enviar da Galeria
        </Button>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept={accept} 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isDragOver 
            ? "border-primary bg-primary/10" 
            : "border-primary/30 bg-muted hover:bg-muted/80"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isDragOver ? (
            <FileImage className="w-8 h-8 mb-4 text-primary animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 mb-4 text-primary" />
          )}
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold text-primary">
              {isDragOver ? 'Solte o arquivo aqui' : 'Clique para enviar'}
            </span>
            {!isDragOver && ' ou arraste e solte'}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou PDF (máx. 10MB)
          </p>
        </div>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept={accept} 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
}