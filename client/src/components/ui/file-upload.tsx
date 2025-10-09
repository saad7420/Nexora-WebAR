import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  accept = ".glb,.gltf,.fbx,.obj",
  maxSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 1,
  className,
  disabled = false
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError(`Invalid file type. Supported formats: ${accept}`);
      } else {
        setError('Upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setUploadedFiles(acceptedFiles);
      onUpload(acceptedFiles);
    }
  }, [onUpload, accept, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'], 
      'application/octet-stream': ['.fbx'],
      'text/plain': ['.obj']
    },
    maxSize,
    maxFiles,
    disabled: disabled || isUploading
  });

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        {...getRootProps()} 
        className={cn(
          "upload-zone cursor-pointer transition-all duration-300",
          isDragActive && "dragover",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
        data-testid="file-upload-zone"
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <input {...getInputProps()} data-testid="file-input" />
          
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          {isDragActive ? (
            <p className="text-lg font-semibold mb-2">Drop your 3D model here</p>
          ) : (
            <h3 className="text-lg font-semibold mb-2">Drag & Drop Your 3D Model</h3>
          )}
          
          <p className="text-muted-foreground mb-4">
            or click to browse files
          </p>
          
          <p className="text-xs text-muted-foreground">
            Supported formats: .glb, .gltf, .fbx, .obj (max {maxSize / (1024 * 1024)}MB)
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center p-4">
            <AlertCircle className="w-5 h-5 text-destructive mr-3" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/30"
                  data-testid={`uploaded-file-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive/80"
                    data-testid={`remove-file-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
