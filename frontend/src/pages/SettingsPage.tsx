import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Bell, 
  ShieldCheck, 
  Palette, 
  Camera,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export const SettingsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Manage your account preferences and global security configuration.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-1 sticky top-24">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                activeTab === tab.id 
                  ? "bg-white dark:bg-slate-900 shadow-md ring-1 ring-slate-200 dark:ring-slate-800" 
                  : "hover:bg-slate-100/50 dark:hover:bg-slate-800/30 text-slate-500 dark:text-slate-400"
              )}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-full"
                />
              )}
              <tab.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                activeTab === tab.id ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )} />
              <span className={cn(
                "text-sm font-bold tracking-tight",
                activeTab === tab.id ? "text-slate-900 dark:text-white" : ""
              )}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          {activeTab === 'profile' && (
            <Card className="glass overflow-hidden border-none shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">Account Intelligence</CardTitle>
                <CardDescription>Identity and profile personalization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl overflow-hidden">
                      {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group-hover:scale-110">
                      <Camera className="w-4 h-4 text-indigo-500" />
                      <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                        {user?.role}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">ID: {user?.id?.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Display Name</Label>
                    <Input defaultValue={user?.name || ''} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Email Address</Label>
                    <Input defaultValue={user?.email || ''} readOnly className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 cursor-not-allowed" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 shadow-lg shadow-indigo-500/20">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="glass border-none shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">Communication Protocol</CardTitle>
                <CardDescription>Configure how you receive real-time updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: 'Document Uploads', desc: 'Notify when new documents are added to your org' },
                  { title: 'Workflow Transitions', desc: 'Updates on document approvals and status changes' },
                  { title: 'Security Alerts', desc: 'Critical alerts regarding blockchain and access integrity' },
                  { title: 'Internal Messaging', desc: 'Notifications for document group chats' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="grid gap-6">
              <Card className="glass border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    Global Access Guard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold tracking-tight">Two-Factor Authentication</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Enhanced Security Protocol</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white">Enable 2FA</Button>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pl-1">
                      <History className="w-3 h-3" />
                      Active Identities
                    </h4>
                    {[
                      { device: 'Windows 11 Home • Chrome 122', location: 'New York, USA', time: 'Active now' },
                      { device: 'iPhone 15 Pro • Mobile App', location: 'London, UK', time: 'Yesterday' }
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold">{session.device}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-tight">{session.location} • {session.time}</p>
                        </div>
                        {i === 0 ? (
                           <span className="text-[10px] font-black text-green-500 uppercase">Current</span>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 p-0 font-bold">Terminate</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Button variant="outline" className="w-full rounded-2xl border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold py-6 group">
                <CheckCircle2 className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                Revoke All Active Identity Tokens
              </Button>
            </div>
          )}

          {activeTab === 'organization' && (
            <Card className="glass border-none shadow-xl border-t-4 border-t-indigo-500">
              <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">Organization Profile</CardTitle>
                <CardDescription>Enterprise entity configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Corporation Name</Label>
                    <Input defaultValue="IntelliDocX Corp" placeholder="Org Name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Global Storage Provider</Label>
                    <Input defaultValue="MinIO Central - Node S3" readOnly className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-mono" />
                  </div>
                 </div>
                 <div className="pt-4 p-4 rounded-2xl bg-slate-950 text-white shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Blockchain Integrity</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 border-r border-white/10 pr-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Network Status</p>
                        <p className="text-sm font-bold">Ganache Localnet</p>
                      </div>
                      <div className="space-y-1 pl-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Signatures</p>
                        <p className="text-sm font-bold">Active & Verified</p>
                      </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="glass border-none shadow-xl overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[64px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
               <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">Visual Aesthetics</CardTitle>
                <CardDescription>Personalize your interface experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pb-12">
                 <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Theme Preferences</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Light', 'Dark', 'System'].map((mode) => (
                        <button key={mode} className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm">
                           <div className="w-full h-12 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1 border-t-2 border-t-indigo-500" />
                           <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{mode}</span>
                        </button>
                      ))}
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Global Accent Color</Label>
                    <div className="flex gap-4">
                      {['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'].map((color) => (
                        <button key={color} className="w-10 h-10 rounded-full shadow-lg border-2 border-white dark:border-slate-900 ring-2 ring-transparent hover:ring-indigo-500 transition-all" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                 </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};
