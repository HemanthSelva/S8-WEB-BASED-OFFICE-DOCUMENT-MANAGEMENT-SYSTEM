import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { Activity, FileText, TrendingUp, TrendingDown, GitPullRequest, Settings, ShieldAlert, Cloud } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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

export const EmployeeDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/analytics/me');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-indigo-500/80">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="animate-pulse font-medium">Loading Workspace Dynamics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'My Documents',
      value: data?.myDocumentsCount || 0,
      icon: FileText,
      trend: '+2%',
      isPositive: true,
      color: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
    },
    {
      title: 'Pending Tasks',
      value: data?.myPendingWorkflows || 0,
      icon: GitPullRequest,
      trend: 'Action Req',
      isPositive: false,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-orange-500/20',
    },
    {
      title: 'Org Documents',
      value: data?.orgTotalDocuments || 0,
      icon: TrendingUp,
      trend: '+15%',
      isPositive: true,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Storage Used',
      value: 24,
      icon: Cloud,
      trend: '24 GB',
      isPositive: true,
      color: 'from-purple-500 to-fuchsia-500',
      shadow: 'shadow-purple-500/20',
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

  const chartData = data?.categoryDistribution || [];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{payload[0].name}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {payload[0].value} <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">assets</span>
          </p>
        </div>
      );
    }
    return null;
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
            Good morning, {user?.name?.split(' ')[0] || 'Employee'} <span className="inline-block hover:rotate-12 hover:scale-110 transition-transform origin-bottom-right cursor-default">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Here's your personal operational overview.</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </div>
        </div>
      </motion.div>

      {/* Animated Metrics Grid */}
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
                {stat.title === 'Storage Used' ? (
                  <span><Counter to={stat.value} /> <span className="text-xl">GB</span></span>
                ) : (
                  <Counter to={stat.value} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        <motion.div variants={slideUp} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-5 h-5 text-blue-500" />
                Personal Contributions
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Breakdown of assets you have uploaded or managed.</p>
            </div>
          </div>
          <div className="h-[320px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                    stroke="transparent"
                  >
                    {chartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <ShieldAlert className="w-8 h-8 mr-2 opacity-50" /> No contribution data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Timeline Feed Container */}
        <motion.div variants={slideUp} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Settings className="w-5 h-5 text-emerald-500 animate-spin-slow" />
                Recent My Activity
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live tracking of your interactions.</p>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.slice(0, 5).map((activity: any, idx: number) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx, type: "spring", stiffness: 300, damping: 24 }}
                  className="relative"
                >
                  <div className="md:flex items-center justify-between">
                    <div className="md:w-full flex items-center gap-4">
                      <div className={`absolute -left-[35px] mt-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white dark:border-slate-950 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20`}>
                        <Activity className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl w-full hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{activity.documentName || 'Personal Event'}</span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(new Date(activity.timestamp || activity.createdAt), 'h:mm a')}</span>
                        </div>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
                <p className="font-medium text-slate-500">No recent personal activity recorded.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
