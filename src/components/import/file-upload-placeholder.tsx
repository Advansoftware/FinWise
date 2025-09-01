"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";

interface FileUploadPlaceholderProps {
  onFileSelect: (file: File) => void;
  fileTypes: string;
  acceptedFormats: string;
}

export function FileUploadPlaceholder({ onFileSelect, fileTypes, acceptedFormats }: FileUploadPlaceholderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && acceptedFormats.includes(file.type)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/30 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-4 text-primary" />
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte
          </p>
          <p className="text-xs text-muted-foreground">{fileTypes}</p>
        </div>
        <input
          ref={fileInputRef}
          id="dropzone-file"
          type="file"
          className="hidden"
          accept={acceptedFormats}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
