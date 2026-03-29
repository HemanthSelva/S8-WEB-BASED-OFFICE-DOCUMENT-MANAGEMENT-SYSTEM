import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight, ShieldCheck, FileText, Zap } from 'lucide-react';

export interface WorkflowTemplate {
  id: string;
  name: string;
  department: string;
  icon: 'ShieldCheck' | 'FileText' | 'Zap';
  steps: { role: string; name: string }[];
  slaHours: number;
  activeInstances: number;
}

interface WorkflowCardProps {
  template: WorkflowTemplate;
  onStart: (id: string) => void;
}

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const WorkflowCard = ({ template, onStart }: WorkflowCardProps) => {
  const IconComponent = template.icon === 'ShieldCheck' ? ShieldCheck : template.icon === 'Zap' ? Zap : FileText;

  return (
    <motion.div 
      variants={itemVariant}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl ring-1 ring-inset ring-indigo-500/0 group-hover:ring-indigo-500/30" />

      {/* Top Header Section */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{template.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              {template.department}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Routing Chain Section */}
      <div className="mb-8 relative z-10 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 tracking-wide uppercase">Routing Sequence</h4>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar">
          {template.steps.map((step, i) => (
            <div key={i} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1 group/step">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shadow-sm group-hover/step:border-indigo-500 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 group-hover/step:bg-indigo-500 transition-colors" />
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 group-hover/step:text-slate-700 dark:group-hover/step:text-slate-200 max-w-[60px] text-center leading-tight truncate px-1">
                  {step.role}
                </span>
              </div>
              {i < template.steps.length - 1 && (
                <div className="w-6 h-[2px] bg-slate-200 dark:bg-slate-800 mx-1 mb-4 shrink-0 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-auto relative z-10">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5" title="SLA Agreement">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {template.slaHours}h SLA
          </div>
          <div className="flex items-center gap-1.5" title="Active Instances">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {template.activeInstances} active
          </div>
        </div>

        <button 
          onClick={() => onStart(template.id)}
          className="bg-slate-900 hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-500 dark:hover:text-white text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
        >
          Start <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
