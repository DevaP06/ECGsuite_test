import UserMenu from './UserMenu';
import Breadcrumb from './Breadcrumb';
import NotificationCenter from './NotificationCenter';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex justify-between items-center bg-white border-b border-gray-100 shadow-sm px-6 py-3 sticky top-0 z-20">
      <div className="flex flex-col gap-0.5 min-w-0">
        {title && <h1 className="text-lg font-bold text-slate-800 leading-none">{title}</h1>}
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
