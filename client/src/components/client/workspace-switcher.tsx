import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  Building, 
  Plus, 
  Settings,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace } from "@shared/schema";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace?: Workspace;
  onWorkspaceChange?: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  className
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use first workspace as default if no current workspace is provided
  const activeWorkspace = currentWorkspace || workspaces[0];

  const handleWorkspaceSelect = (workspace: Workspace) => {
    onWorkspaceChange?.(workspace);
    setIsOpen(false);
  };

  if (workspaces.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={onCreateWorkspace}
            data-testid="create-first-workspace"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Current Workspace Display */}
      <Card 
        className="cursor-pointer hover:bg-card/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="workspace-switcher-trigger"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold/30 to-primary/30 rounded-lg flex items-center justify-center text-lg">
                {activeWorkspace?.name?.[0] || <Building className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {activeWorkspace?.name || 'Select Workspace'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </CardContent>
      </Card>

      {/* Workspace Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto">
          <Card className="glass-card border border-border shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 h-auto",
                      activeWorkspace?.id === workspace.id && "bg-primary/10 text-primary"
                    )}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    data-testid={`workspace-option-${workspace.id}`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-8 h-8 bg-gradient-to-br from-gold/30 to-primary/30 rounded-lg flex items-center justify-center text-sm">
                        {workspace.name[0]}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm truncate">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {workspace.description || 'No description'}
                        </p>
                      </div>
                      {activeWorkspace?.id === workspace.id && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* Actions */}
              <div className="border-t border-border mt-2 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onCreateWorkspace?.();
                    setIsOpen(false);
                  }}
                  data-testid="create-workspace-option"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Create New Workspace
                </Button>
                
                {activeWorkspace && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      // Handle workspace settings
                      setIsOpen(false);
                    }}
                    data-testid="workspace-settings-option"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Workspace Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
