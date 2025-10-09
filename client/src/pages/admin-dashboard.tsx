import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider 
} from "@/components/ui/sidebar";
import { 
  Crown, 
  PieChart, 
  Users, 
  Building, 
  Server, 
  CreditCard, 
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Box,
  Eye
} from "lucide-react";
import { UserTable } from "@/components/admin/user-table";
import { SystemStats } from "@/components/admin/system-stats";

const navigation = [
  { name: 'Overview', href: '#', icon: PieChart, current: true },
  { name: 'Users', href: '#users', icon: Users },
  { name: 'Workspaces', href: '#workspaces', icon: Building },
  { name: 'System Status', href: '#system', icon: Server },
  { name: 'Billing', href: '#billing', icon: CreditCard },
  { name: 'Settings', href: '#settings', icon: Settings },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('overview');

  const { data: systemStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const stats = [
    {
      title: "Total Users",
      value: systemStats?.totalUsers?.toLocaleString() || "0",
      change: "+24",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Workspaces", 
      value: systemStats?.totalWorkspaces?.toLocaleString() || "0",
      change: "+12",
      icon: Building,
      color: "text-accent"
    },
    {
      title: "Total Models",
      value: systemStats?.totalModels?.toLocaleString() || "0",
      change: "+156",
      icon: Box,
      color: "text-gold"
    },
    {
      title: "Monthly Revenue",
      value: "$54.2K",
      change: "+18%",
      icon: DollarSign,
      color: "text-primary"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="w-72 border-r border-border">
          <SidebarHeader className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-display font-bold">Admin Panel</div>
                <div className="text-xs text-muted-foreground">Nexora Control</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-6">
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    onClick={() => setCurrentView(item.href.replace('#', '') || 'overview')}
                    className={`w-full ${
                      currentView === (item.href.replace('#', '') || 'overview') 
                        ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                    data-testid={`admin-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="admin-button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-background">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-display font-bold capitalize">
                {currentView === 'overview' ? 'System Overview' : currentView.replace('-', ' ')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-card rounded-lg border border-border">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
            </div>
          </header>

          {/* Admin Dashboard Content */}
          <main className="flex-1 overflow-auto p-8 bg-background">
            {currentView === 'overview' && (
              <div className="space-y-6">
                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index} className="stat-card" data-testid={`admin-stat-card-${index}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 ${stat.color.replace('text-', 'bg-')}/20 rounded-xl flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <span className="text-xs text-green-500 font-semibold flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {stat.change}
                          </span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.title}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts and Tables */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Users</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setCurrentView('users')} data-testid="admin-view-all-users">
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {users.slice(0, 5).map((user: any, index: number) => (
                          <div key={user.id} className="flex items-center justify-between" data-testid={`admin-recent-user-${index}`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.firstName?.[0] || user.email?.[0] || 'U'}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${
                              user.subscriptionPlan === 'enterprise' ? 'bg-gold/20 text-gold' :
                              user.subscriptionPlan === 'professional' ? 'bg-primary/20 text-primary' :
                              'bg-secondary'
                            }`}>
                              {user.subscriptionPlan || 'starter'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Workspaces */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Top Workspaces</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setCurrentView('workspaces')} data-testid="admin-view-all-workspaces">
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between" data-testid="admin-top-workspace-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                              <Building className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">Bella Italia</div>
                              <div className="text-sm text-muted-foreground">24 models • 12.4K views</div>
                            </div>
                          </div>
                          <div className="text-xs text-green-500 font-semibold">↑ 24%</div>
                        </div>
                        
                        <div className="flex items-center justify-between" data-testid="admin-top-workspace-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                              <Building className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <div className="font-medium">Sushi Master</div>
                              <div className="text-sm text-muted-foreground">18 models • 9.8K views</div>
                            </div>
                          </div>
                          <div className="text-xs text-green-500 font-semibold">↑ 18%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Status */}
                <SystemStats />
              </div>
            )}

            {currentView === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-muted-foreground">Manage user accounts and subscriptions</p>
                  </div>
                </div>
                <UserTable users={users} />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
