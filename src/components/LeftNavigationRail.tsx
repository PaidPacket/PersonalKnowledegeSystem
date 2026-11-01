import React from 'react';
import { WorkspaceView } from './TopHeaderBar';

interface LeftNavigationRailProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onCreateFolder: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceView;
  label: string;
  icon: string;
}> = [
  { id: 'markdown-editor', label: 'Editor Workspace', icon: 'description' },
  { id: 'graph-view', label: 'Graph Visualizer', icon: 'account_tree' },
  { id: 'canvas-view', label: 'Canvas Board', icon: 'widgets' },
  { id: 'daily-notes', label: 'Daily Journal', icon: 'calendar_today' },
  { id: 'vault-settings', label: 'Vault Preferences', icon: 'settings' },
];

export const LeftNavigationRail: React.FC<LeftNavigationRailProps> = ({
  activeView,
  onSelectView,
  onCreateFolder,
}) => {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-40 flex flex-col justify-between py-space-md select-none">
      <div className="flex flex-col gap-space-sm px-space-sm">
        <div className="px-space-sm py-1 flex items-center justify-between text-outline">
          <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline">
            Navigation
          </span>
          <button
            type="button"
            onClick={onCreateFolder}
            title="Create New Folder"
            aria-label="Create New Folder"
            className="material-symbols-outlined text-[16px] cursor-pointer hover:text-on-surface transition-colors"
          >
            create_new_folder
          </button>
        </div>

        <nav className="flex flex-col gap-space-xs" aria-label="Workspace Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-space-sm px-space-sm py-1.5 rounded transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface font-medium border-l-2 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
                <span className="whitespace-nowrap truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-space-sm pt-space-sm border-t border-outline-variant/20">
        <button
          type="button"
          onClick={() => onSelectView('vault-settings')}
          className="w-full flex items-center justify-between px-space-sm py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              lock
            </span>
            <span>Local Storage</span>
          </div>
          <span className="font-code-inline text-code-inline text-outline tabular-nums">
            1,428 notes
          </span>
        </button>
      </div>
    </aside>
  );
};
