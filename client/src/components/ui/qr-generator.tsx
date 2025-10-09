import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Copy, 
  QrCode, 
  ExternalLink,
  Palette,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QRGeneratorProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
  showCustomization?: boolean;
  showDownload?: boolean;
  showCopy?: boolean;
  className?: string;
}

export function QRGenerator({
  value,
  title = "QR Code",
  description = "Scan to view AR experience",
  size = 200,
  showCustomization = true,
  showDownload = true,
  showCopy = true,
  className
}: QRGeneratorProps) {
  const { toast } = useToast();
  const [qrSize, setQrSize] = useState(size);
  const [fgColor, setFgColor] = useState("#1a1a1a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [includeMargin, setIncludeMargin] = useState(true);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = qrSize;
      canvas.height = qrSize;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const downloadSVG = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.download = `qr-code-${Date.now()}.svg`;
    downloadLink.href = svgUrl;
    downloadLink.click();
    
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Card className={cn("", className)} data-testid="qr-generator">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>{title}</span>
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <Badge variant="outline">
            <ExternalLink className="w-3 h-3 mr-1" />
            AR Link
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl border border-border">
            <QRCodeSVG
              id="qr-code-svg"
              value={value}
              size={qrSize}
              fgColor={fgColor}
              bgColor={bgColor}
              level={errorLevel}
              includeMargin={includeMargin}
            />
          </div>
        </div>

        {/* URL Display */}
        <div className="space-y-2">
          <Label>AR Experience URL</Label>
          <div className="flex items-center space-x-2">
            <Input 
              value={value} 
              readOnly 
              className="flex-1 font-mono text-sm"
              data-testid="qr-url-input"
            />
            {showCopy && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(value)}
                data-testid="button-copy-url"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Customization Options */}
        {showCustomization && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <Label className="text-sm font-medium">Customization</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-size">Size</Label>
                <Input
                  id="qr-size"
                  type="number"
                  min="100"
                  max="500"
                  step="50"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  data-testid="input-qr-size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-level">Error Correction</Label>
                <select
                  id="error-level"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")}
                  data-testid="select-error-level"
                >
                  <option value="L">Low (~7%)</option>
                  <option value="M">Medium (~15%)</option>
                  <option value="Q">Quartile (~25%)</option>
                  <option value="H">High (~30%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fg-color">Foreground Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="fg-color"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border"
                    data-testid="input-fg-color"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border"
                    data-testid="input-bg-color"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-margin"
                checked={includeMargin}
                onChange={(e) => setIncludeMargin(e.target.checked)}
                className="w-4 h-4 rounded border-border"
                data-testid="checkbox-include-margin"
              />
              <Label htmlFor="include-margin">Include margin</Label>
            </div>
          </div>
        )}

        {/* Download Actions */}
        {showDownload && (
          <div className="flex items-center space-x-2 pt-4 border-t border-border">
            <Button onClick={downloadQR} className="flex-1" data-testid="button-download-png">
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button variant="outline" onClick={downloadSVG} className="flex-1" data-testid="button-download-svg">
              <Download className="w-4 h-4 mr-2" />
              Download SVG
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
