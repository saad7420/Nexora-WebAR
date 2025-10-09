import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building,
  Box
} from "lucide-react";

interface SystemStatsProps {
  className?: string;
}

interface ConversionJob {
  id: string;
  modelName: string;
  userEmail: string;
  status: 'complete' | 'processing' | 'failed';
  createdAt: string;
  duration?: number;
}

// Mock system metrics (in production these would come from monitoring services)
const systemMetrics = {
  cpu: 45,
  memory: 62,
  disk: 78,
  network: 23,
  uptime: '7d 12h 34m',
  activeConnections: 156,
  responseTime: 145
};

export function SystemStats({ className }: SystemStatsProps) {
  const { data: conversionJobs = [] } = useQuery({
    queryKey: ['/api/admin/conversion-jobs'],
    queryFn: async (): Promise<ConversionJob[]> => {
      // Mock data - in production this would fetch from the API
      return [
        {
          id: '7824',
          modelName: 'Truffle Pasta',
          userEmail: 'john@restaurant.com',
          status: 'complete',
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          duration: 45
        },
        {
          id: '7823', 
          modelName: 'Chocolate Cake',
          userEmail: 'sarah@bistro.com',
          status: 'processing',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '7822',
          modelName: 'Sushi Platter',
          userEmail: 'chef@sushi.com', 
          status: 'failed',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: '7821',
          modelName: 'Caesar Salad',
          userEmail: 'owner@cafe.com',
          status: 'complete',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          duration: 32
        }
      ];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500 bg-green-500/20';
      case 'processing': return 'text-gold bg-gold/20';
      case 'failed': return 'text-destructive bg-destructive/20';
      default: return 'text-muted-foreground bg-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3" />;
      case 'failed': return <AlertTriangle className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const completedJobs = conversionJobs.filter(job => job.status === 'complete');
  const processingJobs = conversionJobs.filter(job => job.status === 'processing');
  const failedJobs = conversionJobs.filter(job => job.status === 'failed');

  return (
    <div className={`space-y-6 ${className}`} data-testid="system-stats">
      {/* System Health Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">{systemMetrics.cpu}%</span>
            </div>
            <Progress value={systemMetrics.cpu} className="h-2" />
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm text-muted-foreground">{systemMetrics.memory}%</span>
            </div>
            <Progress value={systemMetrics.memory} className="h-2" />
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">{systemMetrics.disk}%</span>
            </div>
            <Progress value={systemMetrics.disk} className="h-2" />
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <span className="text-sm text-muted-foreground">{systemMetrics.network}%</span>
            </div>
            <Progress value={systemMetrics.network} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* System Info & Conversion Queue */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System Information</span>
            </CardTitle>
            <CardDescription>Current system status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">{systemMetrics.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Connections</span>
                  <span className="text-sm font-medium">{systemMetrics.activeConnections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm font-medium">{systemMetrics.responseTime}ms</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processing Jobs</span>
                  <Badge className="bg-gold/20 text-gold">{processingJobs.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Failed Jobs</span>
                  <Badge className="bg-destructive/20 text-destructive">{failedJobs.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed Today</span>
                  <Badge className="bg-green-500/20 text-green-500">{completedJobs.length}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversion Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Box className="w-5 h-5" />
              <span>Conversion Queue</span>
            </CardTitle>
            <CardDescription>Recent 3D model conversion jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionJobs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No recent conversion jobs
                </div>
              ) : (
                conversionJobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(job.status)} border-0 px-2 py-1`}>
                        {getStatusIcon(job.status)}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{job.modelName}</p>
                        <p className="text-xs text-muted-foreground">{job.userEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">#{job.id}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(job.createdAt)}</p>
                      {job.duration && (
                        <p className="text-xs text-green-500">{job.duration}s</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Status of all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">API Server</p>
                  <p className="text-sm text-muted-foreground">Running normally</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-500">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-500">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gold/10 rounded-lg border border-gold/20">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium">Conversion Service</p>
                  <p className="text-sm text-muted-foreground">High load</p>
                </div>
              </div>
              <Badge className="bg-gold/20 text-gold">Busy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
