import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LayoutDashboard, FileText, GitPullRequest, Settings, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: `/dashboard/${user?.role.toLowerCase()}`,
      icon: LayoutDashboard,
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: FileText,
    },
    {
      title: 'Workflows',
      href: '/workflows',
      icon: GitPullRequest,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 flex items-center justify-between border-b h-16">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary truncate">IntelliDocX</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("ml-auto", collapsed && "mx-auto")}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              location.pathname.startsWith(item.href) && "bg-accent/50 text-accent-foreground border-r-2 border-primary",
              collapsed ? "justify-center" : "mx-2 rounded-md"
            )}
            title={collapsed ? item.title : undefined}
          >
            <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold">{user?.role}</p>
            <p className="truncate">{user?.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
};
