import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Activity, FileText, TrendingUp, AlertTriangle, Users, CheckCircle } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/overview');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  const summary = stats?.summary || {};

  const statCards = [
    {
      title: 'Total Documents',
      value: summary.totalDocuments || 0,
      icon: FileText,
      description: 'Files across organization',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Pending Workflows',
      value: summary.pendingWorkflows || 0,
      icon: AlertTriangle,
      description: 'Approval processes active',
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Active Users (Daily)',
      value: summary.activeUsers || 0,
      icon: Users,
      description: 'Unique daily logins',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Blockchain Secured',
      value: summary.blockchainRegistered || 0,
      icon: CheckCircle,
      description: 'On-chain proof of existence',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Global system control and analytics</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{format(new Date(), 'eeee, MMMM do')}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">REF: {new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.slice(0, 3).map((stat, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Distribution Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Document Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats?.docs?.categoryDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.docs.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="category"
                      >
                        {stats.docs.categoryDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No distribution data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Activity */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity?.length > 0 ? (
                    stats.recentActivity.map((activity: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="p-2 rounded-full bg-slate-100 mt-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {activity.documentName
                              ? `${activity.documentName}`
                              : activity.action}
                          </p>
                          {activity.documentName && (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 mt-0.5">
                              {activity.action}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.timestamp || activity.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">No recent activity record found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
