import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Share, 
  QrCode,
  MoreHorizontal,
  Edit,
  Download,
  Trash2,
  ExternalLink,
  Smartphone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModelCardProps {
  id?: string;
  name: string;
  description?: string;
  project: string;
  price?: string;
  views: number;
  thumbnailUrl?: string;
  shortLink?: string;
  status?: 'complete' | 'processing' | 'failed';
  category?: string;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onQRCode?: () => void;
  onDelete?: () => void;
  onViewAR?: () => void;
}

const statusConfig = {
  complete: { color: 'text-green-500', bg: 'bg-green-500/20', label: 'Ready' },
  processing: { color: 'text-gold', bg: 'bg-gold/20', label: 'Processing' },
  failed: { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Failed' }
};

export function ModelCard({
  id,
  name,
  description,
  project,
  price,
  views,
  thumbnailUrl,
  shortLink,
  status = 'complete',
  category,
  className,
  onClick,
  onEdit,
  onShare,
  onQRCode,
  onDelete,
  onViewAR
}: ModelCardProps) {
  const statusStyle = statusConfig[status];

  const formatViews = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card 
      className={cn(
        "hover-lift cursor-pointer group overflow-hidden",
        className
      )}
      onClick={onClick}
      data-testid={`model-card-${id || name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-0">
        {/* 3D Model Preview */}
        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                <Eye className="w-8 h-8 text-primary/50" />
              </div>
            </div>
          )}

          {/* Status Badge */}
          {status !== 'complete' && (
            <div className="absolute top-3 left-3">
              <Badge className={`${statusStyle.bg} ${statusStyle.color} border-0`}>
                {statusStyle.label}
              </Badge>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
            {status === 'complete' && onViewAR && (
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 shadow-lg"
                onClick={(e) => { e.stopPropagation(); onViewAR(); }}
                data-testid={`model-view-ar-${id}`}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            )}
            {onQRCode && (
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm shadow-lg"
                onClick={(e) => { e.stopPropagation(); onQRCode(); }}
                data-testid={`model-qr-${id}`}
              >
                <QrCode className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Processing Overlay */}
          {status === 'processing' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto" />
                <p className="text-sm font-medium">Processing...</p>
              </div>
            </div>
          )}

          {/* Failed Overlay */}
          {status === 'failed' && (
            <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-destructive text-sm">✕</span>
                </div>
                <p className="text-sm font-medium text-destructive">Failed</p>
              </div>
            </div>
          )}
        </div>

        {/* Model Info */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold mb-1 line-clamp-1">{name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{project}</p>
            {category && (
              <Badge variant="outline" className="mt-2 text-xs">
                {category}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            {price && (
              <span className="font-semibold text-primary">{price}</span>
            )}
            <div className="flex items-center text-muted-foreground">
              <Eye className="w-4 h-4 mr-1" />
              <span>{formatViews(views)} views</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-3 border-t border-border">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                data-testid={`model-share-${id}`}
              >
                <Share className="w-3 h-3 mr-1" />
                Share
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`model-menu-${id}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Model
                  </DropdownMenuItem>
                )}
                {shortLink && (
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigator.clipboard.writeText(shortLink);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copy AR Link
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
