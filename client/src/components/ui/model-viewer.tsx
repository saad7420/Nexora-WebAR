import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  Maximize2, 
  Lightbulb, 
  Smartphone, 
  Eye,
  Share,
  Download,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  src?: string;
  iosSrc?: string;
  alt?: string;
  poster?: string;
  name?: string;
  description?: string;
  price?: string;
  hotspots?: Array<{
    position: string;
    text: string;
    info?: string;
  }>;
  className?: string;
  showControls?: boolean;
  showARButton?: boolean;
  onARLaunch?: () => void;
  onShare?: () => void;
  onQRCode?: () => void;
}

export function ModelViewer({
  src,
  iosSrc,
  alt = "3D Model",
  poster,
  name,
  description,
  price,
  hotspots = [],
  className,
  showControls = true,
  showARButton = true,
  onARLaunch,
  onShare,
  onQRCode
}: ModelViewerProps) {
  const modelRef = useRef<any>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check AR support
    if (typeof window !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      setIsARSupported(isIOS || isAndroid);
    }

    // Load model-viewer script if not already loaded
    if (!window.customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  const handleRotate = () => {
    if (modelRef.current) {
      modelRef.current.resetTurntableRotation();
    }
  };

  const handleFullscreen = () => {
    if (modelRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        modelRef.current.requestFullscreen();
      }
    }
  };

  const handleLighting = () => {
    if (modelRef.current) {
      const currentEnvironment = modelRef.current.environmentImage;
      modelRef.current.environmentImage = currentEnvironment === 'neutral' ? 'legacy' : 'neutral';
    }
  };

  const handleARClick = () => {
    onARLaunch?.();
    // The model-viewer will handle the AR activation
  };

  if (!src && !iosSrc) {
    return (
      <Card className={cn("aspect-square", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No 3D model available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)} data-testid="model-viewer-container">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {/* Model Viewer */}
          <model-viewer
            ref={modelRef}
            src={src}
            ios-src={iosSrc}
            alt={alt}
            poster={poster}
            camera-controls="true"
            environment-image="neutral"
            shadow-intensity="1"
            auto-rotate="true"
            ar={isARSupported ? "true" : undefined}
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            loading="eager"
            reveal="interaction"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load 3D model');
            }}
            data-testid="model-viewer-element"
          />

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm font-medium">Loading 3D model...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          {showControls && !isLoading && !error && (
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleRotate}
                data-testid="button-rotate"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleFullscreen}
                data-testid="button-fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleLighting}
                data-testid="button-lighting"
              >
                <Lightbulb className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Model Info Overlay */}
          {(name || description || price) && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {name && (
                        <h3 className="font-semibold text-lg mb-1">{name}</h3>
                      )}
                      {description && (
                        <p className="text-sm text-muted-foreground mb-2">{description}</p>
                      )}
                    </div>
                    {price && (
                      <Badge className="bg-gold/20 text-gold ml-2">
                        {price}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {onShare && (
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={onShare}
                data-testid="button-share"
              >
                <Share className="w-4 h-4" />
              </Button>
            )}
            
            {onQRCode && (
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={onQRCode}
                data-testid="button-qr"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            )}

            {showARButton && isARSupported && (
              <Button
                className="btn-primary"
                onClick={handleARClick}
                data-testid="button-view-ar"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                View in AR
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Type declaration for model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}
