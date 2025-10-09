import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Clock, 
  Layers, 
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDistanceToNow } from "@/lib/utils";

interface ProjectCardProps {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  modelCount: number;
  views: number;
  updatedAt: string | Date;
  status: 'Active' | 'Archived' | 'Draft';
  avgSessionTime?: string;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onViewAnalytics?: () => void;
}

const statusConfig = {
  Active: { color: 'text-accent', bg: 'bg-accent/20', border: 'border-accent/30' },
  Archived: { color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
  Draft: { color: 'text-gold', bg: 'bg-gold/20', border: 'border-gold/30' }
};

export function ProjectCard({
  id,
  name,
  description,
  icon,
  modelCount,
  views,
  updatedAt,
  status,
  avgSessionTime,
  className,
  onClick,
  onEdit,
  onArchive,
  onDelete,
  onViewAnalytics
}: ProjectCardProps) {
  const statusStyle = statusConfig[status];
  const formattedDate = typeof updatedAt === 'string' ? updatedAt : formatDistanceToNow(updatedAt);

  const formatViews = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card 
      className={cn(
        "hover-lift cursor-pointer transition-all duration-200 overflow-hidden",
        className
      )}
      onClick={onClick}
      data-testid={`project-card-${id || name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-background/50 backdrop-blur rounded-xl flex items-center justify-center text-3xl">
              {icon || <Layers className="w-7 h-7 text-primary" />}
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} border font-semibold`}
              >
                {status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 bg-background/50 hover:bg-background/80"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`project-menu-${id}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                  )}
                  {onViewAnalytics && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewAnalytics(); }}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Analytics
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onArchive && status === 'Active' && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
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
          
          <h3 className="text-xl font-bold mb-2">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{modelCount}</p>
              <p className="text-xs text-muted-foreground">Models</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{formatViews(views)}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">{avgSessionTime || '2m 15s'}</p>
              <p className="text-xs text-muted-foreground">Avg Time</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              <span>Updated {formattedDate}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-muted-foreground">
                <Eye className="w-4 h-4 mr-1" />
                <span>{formatViews(views)}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Layers className="w-4 h-4 mr-1" />
                <span>{modelCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function for date formatting (add to lib/utils.ts if not present)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
