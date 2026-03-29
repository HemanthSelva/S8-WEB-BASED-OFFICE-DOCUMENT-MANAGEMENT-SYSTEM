import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, GripVertical, Clock, Save, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => Promise<void>;
}

export const CreateTemplateModal = ({ isOpen, onClose, onSave }: CreateTemplateModalProps) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [steps, setSteps] = useState([{ id: '1', role: 'MANAGER', name: 'Initial Review' }]);
  const [slaHours, setSlaHours] = useState(24);
  const [isSaving, setIsSaving] = useState(false);

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), role: 'FINANCE', name: 'Financial Approval' }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id));
    }
  };

  const handleSave = async () => {
    if (!name || steps.length === 0) return;
    setIsSaving(true);
    try {
      await onSave({ name, department, steps, slaHours });
      onClose();
      // Reset
      setName('');
      setDepartment('');
      setSteps([{ id: '1', role: 'MANAGER', name: 'Initial Review' }]);
      setSlaHours(24);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto sm:max-h-[85vh] p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Plus className="w-5 h-5" />
            </div>
            Design Workflow Engine
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Name</label>
              <input 
                type="text" 
                placeholder="e.g. Q3 Vendor Payment Routing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-900 dark:text-white transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Focus</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-900 dark:text-white appearance-none transition-shadow"
                >
                  <option value="">Select Department...</option>
                  <option value="FINANCE">Finance & Legal</option>
                  <option value="HR">Human Resources</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="SALES">Sales & Operations</option>
                </select>
              </div>
            </div>
          </div>

          {/* Builder Dropzone */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Sequence</label>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">Drag to Reorder</span>
            </div>
            
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
              <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-3">
                {steps.map((step, index) => (
                  <Reorder.Item 
                    key={step.id} 
                    value={step} 
                    className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                  >
                    <div className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                      {index + 1}
                    </div>
                    
                    <select 
                      value={step.role}
                      onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, role: e.target.value } : s))}
                      className="h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-36 cursor-pointer"
                    >
                      <option value="MANAGER">MANAGER</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="LEGAL">LEGAL</option>
                      <option value="DIRECTOR">DIRECTOR</option>
                    </select>

                    <input 
                      type="text" 
                      value={step.name}
                      onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s))}
                      placeholder="Step Title (e.g. Code Review)"
                      className="flex-1 h-10 px-3 bg-transparent border-none text-sm font-medium outline-none"
                    />

                    {steps.length > 1 && (
                      <button onClick={() => removeStep(step.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              <div className="mt-4 flex justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addStep} 
                  className="rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-all text-slate-500 dark:text-slate-400 h-12 w-full max-w-sm font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" /> Append Approval Step
                </Button>
              </div>
            </div>
          </div>

          {/* SLA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" /> Resolution SLA limit
              </label>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{slaHours} Hours</div>
            </div>
            
            <div className="px-2">
              <input 
                type="range" 
                min="1" 
                max="168" 
                value={slaHours} 
                onChange={(e) => setSlaHours(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-2">
                <span>1h (Urgent)</span>
                <span>24h (Standard)</span>
                <span>168h (1 Week)</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name || steps.length === 0 || isSaving}
            className="rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 px-8 h-10"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Deploy Engine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
