import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  Mail,
  ExternalLink,
  Filter,
  Download
} from "lucide-react";
import type { User } from "@shared/schema";

interface UserTableProps {
  users: User[];
  onUserEdit?: (user: User) => void;
  onUserSuspend?: (userId: string) => void;
  onUserMessage?: (userId: string) => void;
}

const subscriptionColors = {
  starter: 'bg-secondary text-foreground',
  professional: 'bg-primary/20 text-primary border-primary/30',
  enterprise: 'bg-gold/20 text-gold border-gold/30'
};

export function UserTable({ users, onUserEdit, onUserSuspend, onUserMessage }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created' | 'plan'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlan = filterPlan === 'all' || user.subscriptionPlan === filterPlan;
      
      return matchesSearch && matchesPlan;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'plan':
          aValue = a.subscriptionPlan || 'starter';
          bValue = b.subscriptionPlan || 'starter';
          break;
        case 'created':
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Plan', 'Status', 'Created At'],
      ...filteredUsers.map(user => [
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.email || '',
        user.subscriptionPlan || 'starter',
        user.subscriptionStatus || 'active',
        formatDate(user.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card data-testid="admin-user-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and subscriptions ({filteredUsers.length} of {users.length} users)
            </CardDescription>
          </div>
          <Button onClick={exportUsers} variant="outline" data-testid="export-users">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-users"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              data-testid="filter-plan"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              data-testid="sort-users"
            >
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="plan-desc">Plan: Enterprise First</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || filterPlan !== 'all' ? 'No users match your filters' : 'No users found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.firstName?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : 'Unknown User'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-mono text-sm">{user.email || 'No email'}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={subscriptionColors[user.subscriptionPlan || 'starter']}
                      >
                        {(user.subscriptionPlan || 'starter').charAt(0).toUpperCase() + 
                         (user.subscriptionPlan || 'starter').slice(1)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                        className={
                          user.subscriptionStatus === 'active' 
                            ? 'bg-green-500/20 text-green-500'
                            : user.subscriptionStatus === 'canceled'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-gold/20 text-gold'
                        }
                      >
                        {user.subscriptionStatus || 'active'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{formatDate(user.createdAt)}</div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`user-menu-${user.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          
                          {onUserEdit && (
                            <DropdownMenuItem onClick={() => onUserEdit(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                          )}
                          
                          {onUserMessage && user.email && (
                            <DropdownMenuItem onClick={() => onUserMessage(user.id)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {onUserSuspend && user.subscriptionStatus === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => onUserSuspend(user.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="text-sm text-muted-foreground">
              Active: {users.filter(u => u.subscriptionStatus === 'active').length} • 
              Professional: {users.filter(u => u.subscriptionPlan === 'professional').length} • 
              Enterprise: {users.filter(u => u.subscriptionPlan === 'enterprise').length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
