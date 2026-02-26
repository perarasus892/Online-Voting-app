import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, User, ShieldCheck, Activity } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  userRole: 'voter' | 'admin';
}

export default function BottomNav({ currentRoute, userRole }: BottomNavProps) {
  const navigate = useNavigate();

  const voterNavItems = [
    { id: 'dashboard', label: 'Hub', icon: Home, route: '/dashboard' },
    { id: 'results', label: 'Monitor', icon: Activity, route: '/results' },
    { id: 'profile', label: 'Identity', icon: User, route: '/profile' }
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Hub', icon: ShieldCheck, route: '/admin' },
    { id: 'results', label: 'Monitor', icon: Activity, route: '/results' },
    { id: 'profile', label: 'Identity', icon: User, route: '/profile' }
  ];

  const navItems = userRole === 'admin' ? adminNavItems : voterNavItems;

  return (
    <nav className="w-full h-full bg-white/80 backdrop-blur-3xl">
      <div className="flex items-center justify-around w-full px-6 gap-4">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center flex-1 py-4 px-1 rounded-3xl transition-all group relative ${isActive
                ? 'text-indigo-600'
                : 'text-slate-300 hover:text-slate-600'
                }`}
            >
              <div className={`relative mb-1 transition-all group-active:scale-95 ${isActive ? 'scale-110' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2 opacity-60'}`} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-sm animate-pulse" />
                )}
              </div>
              <span className={`text-[8px] uppercase font-black tracking-[0.2em] transition-all ${isActive ? 'text-indigo-600' : 'text-slate-300'
                }`}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-2 w-6 h-1 bg-indigo-600 rounded-full animate-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
