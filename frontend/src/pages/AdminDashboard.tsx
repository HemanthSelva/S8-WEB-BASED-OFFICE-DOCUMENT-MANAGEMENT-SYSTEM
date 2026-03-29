import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Activity, FileText, Users, ShieldCheck, TrendingUp, TrendingDown, UploadCloud, Trash2, Settings, ShieldAlert, GitPullRequest } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { motion, useMotionValue, animate } from 'framer-motion';

const Counter = ({ from = 0, to }: { from?: number; to: number }) => {
  const count = useMotionValue(from);
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (val) => setDisplay(Math.round(val))
    });
    return controls.stop;
  }, [count, to]);

  return <span>{display}</span>;
};

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-indigo-500/80">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="animate-pulse font-medium">Aggregating Global Telemetry...</p>
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {};

  const statCards = [
    {
      title: 'Total Storage Volume',
      value: summary.totalDocuments || 0,
      icon: FileText,
      trend: '+12%',
      isPositive: true,
      color: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
      line: 'bg-blue-500'
    },
    {
      title: 'Active Workflows',
      value: summary.pendingWorkflows || 0,
      icon: GitPullRequest,
      trend: '-2%',
      isPositive: false,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-orange-500/20',
      line: 'bg-orange-500'
    },
    {
      title: 'Global Identity Access',
      value: summary.activeUsers || 0,
      icon: Users,
      trend: '+45%',
      isPositive: true,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      line: 'bg-emerald-500'
    },
    {
      title: 'Blockchain Integrity',
      value: summary.blockchainRegistered || 0,
      icon: ShieldCheck,
      trend: '100%',
      isPositive: true,
      color: 'from-purple-500 to-fuchsia-500',
      shadow: 'shadow-purple-500/20',
      line: 'bg-purple-500'
    },
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Mock chart data using whatever distribution structure exists
  const chartData = stats?.docs?.categoryDistribution?.length > 0 
    ? stats.docs.categoryDistribution 
    : [
        { category: 'Mon', count: 12 }, { category: 'Tue', count: 19 },
        { category: 'Wed', count: 15 }, { category: 'Thu', count: 28 },
        { category: 'Fri', count: 22 }, { category: 'Sat', count: 35 },
        { category: 'Sun', count: 42 }
      ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {payload[0].value} <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">assets</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getActivityIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('UPLOAD')) return <UploadCloud className="w-4 h-4 text-blue-500" />;
    if (act.includes('DELETE')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (act.includes('WORKFLOW') || act.includes('APPROV')) return <GitPullRequest className="w-4 h-4 text-purple-500" />;
    if (act.includes('LOGIN')) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getActivityColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('UPLOAD')) return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    if (act.includes('DELETE')) return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    if (act.includes('WORKFLOW') || act.includes('APPROV')) return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
    if (act.includes('LOGIN')) return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-8 pb-10"
    >
      {/* Greeting Header */}
      <motion.div variants={slideUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Good morning, Admin <span className="inline-block hover:rotate-12 hover:scale-110 transition-transform origin-bottom-right cursor-default">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Here's your global telemetry overview for the workspace.</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-8">
        <motion.div variants={slideUp}>
          <TabsList className="bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-2xl h-14 border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm transition-all">Directory</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all">Security Logs</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="overview" className="space-y-8 outline-none">
          {/* Animated Metrics */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <motion.div 
                key={idx}
                variants={slideUp}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-80`} />
                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.03] dark:opacity-[0.08] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${stat.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {stat.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                
                <div className="space-y-1 relative z-10">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</h3>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    <Counter to={stat.value} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Massive Area Chart Container */}
            <motion.div variants={slideUp} className="xl:col-span-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Asset Processing Throughput
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Files verified over the active cycle.</p>
                </div>
              </div>
              
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} className="dark:stroke-slate-800" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Timeline Feed Container */}
            <motion.div variants={slideUp} className="xl:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Settings className="w-5 h-5 text-purple-500 animate-spin-slow" />
                    System Pulse
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live audit stream.</p>
                </div>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {stats?.recentActivity?.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx, type: "spring", stiffness: 300, damping: 24 }}
                      className="relative"
                    >
                      <div className="md:flex items-center justify-between">
                        <div className="md:w-full flex items-center gap-4">
                          <div className={`absolute -left-[35px] mt-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white dark:border-slate-950 ${getActivityColor(activity.action)}`}>
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl w-full hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{activity.documentName || 'System Core'}</span>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(new Date(activity.timestamp || activity.createdAt), 'h:mm a')}</span>
                            </div>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActivityColor(activity.action)}`}>
                              {activity.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <ShieldAlert className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="font-medium text-slate-500">No recent network activity captured.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </TabsContent>

        <TabsContent value="users" className="outline-none">
          <motion.div variants={slideUp}>
            <UserManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="audit" className="outline-none">
          <motion.div variants={slideUp}>
            <AuditLogs />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
