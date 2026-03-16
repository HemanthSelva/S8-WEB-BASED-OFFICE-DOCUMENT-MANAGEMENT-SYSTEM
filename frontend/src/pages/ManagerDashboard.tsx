import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, GitPullRequest, Activity, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';

export const ManagerDashboard = () => {
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

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    const summary = stats?.summary || {};

    const statCards = [
        {
            title: 'Total Documents',
            value: summary.totalDocuments || 0,
            icon: FileText,
            description: 'Total files in organization',
            color: 'text-blue-600',
            bg: 'bg-blue-100',
        },
        {
            title: 'Pending Workflows',
            value: summary.pendingWorkflows || 0,
            icon: GitPullRequest,
            description: 'Awaiting managerial action',
            color: 'text-orange-600',
            bg: 'bg-orange-100',
        },
        {
            title: 'Active Users',
            value: summary.activeUsers || 0,
            icon: TrendingUp,
            description: 'Unique users active today',
            color: 'text-green-600',
            bg: 'bg-green-100',
        },
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Process department stats for the chart if possible, or category
    // The image shows Invoice/Resume so it's likely by category.
    // Employee dashboard uses categoryDistribution. 
    // Manager overview has 'docs' which might have it.

    const chartData = stats?.docs?.categoryDistribution || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manager Dashboard</h1>
                <p className="text-muted-foreground">{format(new Date(), 'eeee, MMMM do')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, idx) => (
                    <Card key={idx}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Distribution Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Document Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="category"
                                    >
                                        {chartData.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available
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
                                                {activity.documentName || activity.action}
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
                                <p className="text-sm text-muted-foreground py-8 text-center">No recent activity found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
