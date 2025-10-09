import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Box, 
  LayoutDashboard, 
  FolderOpen, 
  Layers, 
  Upload, 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard,
  HelpCircle,
  LogOut,
  Plus,
  Eye,
  Clock,
  TrendingUp,
  Bell
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/client/workspace-switcher";
import { ProjectCard } from "@/components/client/project-card";
import { ModelCard } from "@/components/client/model-card";
import { UploadForm } from "@/components/client/upload-form";
import { AnalyticsChart } from "@/components/ui/analytics-chart";

const navigation = [
  { name: 'Dashboard', href: '#', icon: LayoutDashboard, current: true },
  { name: 'Projects', href: '#projects', icon: FolderOpen, count: 8 },
  { name: 'AR Models', href: '#models', icon: Box, count: 42 },
  { name: 'Upload Model', href: '#upload', icon: Upload },
  { name: 'Analytics', href: '#analytics', icon: BarChart3 },
  { name: 'Team', href: '#team', icon: Users },
  { name: 'Billing', href: '#billing', icon: CreditCard },
  { name: 'Settings', href: '#settings', icon: Settings },
  { name: 'Help & Support', href: '#support', icon: HelpCircle },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const { data: workspaces = [] } = useQuery({
    queryKey: ['/api/workspaces'],
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/summary'],
    queryFn: async () => {
      if (workspaces.length === 0) return null;
      const response = await fetch(`/api/analytics/${workspaces[0].id}/summary?days=7`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: workspaces.length > 0,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const stats = [
    {
      title: "Total AR Views",
      value: analytics?.totalViews?.toLocaleString() || "0",
      change: "+12.5%",
      icon: Eye,
      color: "text-primary"
    },
    {
      title: "Active Models", 
      value: analytics?.activeModels?.toLocaleString() || "0",
      change: "+8.2%",
      icon: Box,
      color: "text-accent"
    },
    {
      title: "Avg. Session Time",
      value: analytics?.avgSessionDuration ? `${Math.floor(analytics.avgSessionDuration / 60)}m ${analytics.avgSessionDuration % 60}s` : "0s",
      change: "+5.3%",
      icon: Clock,
      color: "text-gold"
    },
    {
      title: "Active Projects",
      value: "8",
      change: "Active",
      icon: Layers,
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
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-display font-bold">Nexora</span>
                <p className="text-xs text-muted-foreground">Client Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-4">
            <WorkspaceSwitcher workspaces={workspaces} />
            
            <SidebarMenu className="mt-6 space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    onClick={() => setCurrentView(item.href.replace('#', '') || 'dashboard')}
                    className={`w-full justify-between ${
                      currentView === (item.href.replace('#', '') || 'dashboard') 
                        ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.name}</span>
                    </div>
                    {item.count && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
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
                {currentView === 'dashboard' ? 'Dashboard' : currentView.replace('-', ' ')}
              </h1>
              {user?.subscriptionPlan && (
                <Badge className="bg-gold/20 text-gold capitalize">
                  {user.subscriptionPlan} Plan
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={() => setCurrentView('upload')} data-testid="button-new-project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button variant="outline" size="icon" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 overflow-auto p-8 bg-background">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index} className="stat-card" data-testid={`stat-card-${index}`}>
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

                {/* Charts and Recent Activity */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <ProjectCard 
                            name="Summer Specials 2025"
                            modelCount={12}
                            views={3245}
                            updatedAt="2 hours ago"
                            status="Active"
                            icon="☀️"
                          />
                          <ProjectCard 
                            name="Main Menu"
                            modelCount={28}
                            views={8912}
                            updatedAt="1 day ago"
                            status="Active"
                            icon="🍝"
                          />
                          <ProjectCard 
                            name="Holiday Promo"
                            modelCount={6}
                            views={1567}
                            updatedAt="3 days ago"
                            status="Archived"
                            icon="🎄"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full btn-primary" onClick={() => setCurrentView('upload')} data-testid="quick-upload-model">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Model
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setCurrentView('projects')} data-testid="quick-create-project">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Project
                        </Button>
                        <Button variant="outline" className="w-full" data-testid="quick-generate-qr">
                          <Box className="w-4 h-4 mr-2" />
                          Generate QR
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setCurrentView('analytics')} data-testid="quick-view-analytics">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'upload' && (
              <UploadForm workspaces={workspaces} />
            )}

            {currentView === 'analytics' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AR Views Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsChart data={analytics?.chartData || []} />
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === 'models' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">AR Models</h2>
                    <p className="text-muted-foreground">View and manage all your 3D models</p>
                  </div>
                  <Button onClick={() => setCurrentView('upload')} data-testid="button-upload-model">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Model
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Input placeholder="Search models..." className="max-w-md" data-testid="input-search-models" />
                  <select className="px-4 py-2 bg-background border border-border rounded-lg">
                    <option>All Projects</option>
                    <option>Summer Specials 2025</option>
                    <option>Main Menu</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <ModelCard 
                    name="Margherita Pizza"
                    project="Summer Specials 2025"
                    price="$14.99"
                    views={2847}
                  />
                  <ModelCard 
                    name="Tiramisu"
                    project="Main Menu"
                    price="$8.99"
                    views={2134}
                  />
                  <ModelCard 
                    name="Carbonara"
                    project="Main Menu"
                    price="$16.99"
                    views={1892}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
