import React, { useState } from 'react';

export type WorkspaceView =
  | 'markdown-editor'
  | 'graph-view'
  | 'canvas-view'
  | 'daily-notes'
  | 'vault-settings';

interface TopHeaderBarProps {
  vaultName: string;
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onOpenCommandPalette: () => void;
  onOpenThinkingModal: () => void;
  onOpenPresentationDeck: () => void;
  syncStatusText: string;
  noteCount: number;
  firebaseUser?: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  onSignInFirebase?: () => void;
  onSignOutFirebase?: () => void;
}

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1VL8sfSP-mSlyHUL0bv3P_KVhEdJ5qliXq1mVvKdFtuM3zHSaDsxYnZYYzcXS7XQ3TtRmyfM8IdL9FZD0mQ8SI1T57CAln25vms6wtVBnFR0Psioxtub_S1OouoomazJsyaSUk0IDZbn8WRjIpJO1_7xNNWJlrbfbXCAhcSUKvxw58ZnG3j66lQ-hTjYZuqAo205DxHwbFWVjnZcP-uTQdXSZx_q7XzSAHsd2rJAv_1WDwxlTElmYkWTKVD';

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDSN2KY6Gv5hVUyJjefHi-a6fduPu-rIydxln-Oh7Tz3J0FZcHRr2rh5Ubtg3v6Z-xkaR635gVUPN2Nlgplk8-35lGcFccGMgE6IrYIx_idu2HEGyfKLNYyu8Taq-R0qXh2umY0J83uXV8D6DaZku8ihZNQxdIPHhqpkjdslgQe5w7RQKOSR-3xPjrdyCKe-Mmc1E05QRn62h18mlkgRLu0O7A9ilUNFWK6RVfmomY0gsv21pbhkobY9Q';

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  vaultName,
  activeView,
  onSelectView,
  onOpenCommandPalette,
  onOpenThinkingModal,
  onOpenPresentationDeck,
  syncStatusText,
  noteCount,
  firebaseUser,
  onSignInFirebase,
  onSignOutFirebase,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [vaultMenuOpen, setVaultMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-gutter-desktop select-none">
      {/* Left Zone: Window Controls + Brand + Vault Switcher */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1.5 mr-space-xs" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block opacity-80 hover:opacity-100 transition-opacity" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block opacity-80 hover:opacity-100 transition-opacity" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block opacity-80 hover:opacity-100 transition-opacity" />
        </div>

        <button
          type="button"
          onClick={() => onSelectView('markdown-editor')}
          className="flex items-center gap-space-xs text-left focus:outline-none"
        >
          {!logoError ? (
            <img
              alt="Your Notes Logo"
              className="h-6 w-auto object-contain"
              src={LOGO_URL}
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="w-6 h-6 rounded bg-[#494bd6]/30 border border-primary/40 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[15px]">
                notes
              </span>
            </span>
          )}
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-medium whitespace-nowrap">
            Your Notes
          </span>
        </button>

        <div className="h-4 w-[1px] bg-outline-variant/40 mx-space-xs" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setVaultMenuOpen((prev) => !prev)}
            aria-expanded={vaultMenuOpen}
            className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 cursor-pointer text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-outline text-[16px]">
              folder_supervised
            </span>
            <span className="font-label-md text-label-md text-on-surface whitespace-nowrap">
              {vaultName}
            </span>
            <span className="material-symbols-outlined text-outline text-[16px]">
              arrow_drop_down
            </span>
          </button>

          {vaultMenuOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 rounded-lg bg-surface-container-high border border-outline-variant/40 shadow-xl py-1.5 z-50 text-on-surface"
              onMouseLeave={() => setVaultMenuOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-outline-variant/20">
                <div className="text-[11px] font-label-sm uppercase tracking-wider text-outline">
                  Active Knowledge Vault
                </div>
                <div className="text-xs font-medium text-on-surface mt-0.5">
                  {vaultName} ({noteCount} indexed notes)
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVaultMenuOpen(false);
                  onSelectView('markdown-editor');
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-surface-container-highest flex items-center justify-between"
              >
                <span>Editor Workspace</span>
                <span className="font-code-inline text-[10px] text-secondary">Active</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVaultMenuOpen(false);
                  onOpenPresentationDeck();
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-surface-container-highest flex items-center justify-between text-on-surface"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">slideshow</span>
                  <span>11-Slide Project Deck</span>
                </span>
                <span className="font-code-inline text-[10px] text-secondary">PPTX</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVaultMenuOpen(false);
                  onSelectView('vault-settings');
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-surface-container-highest flex items-center justify-between text-on-surface-variant"
              >
                <span>Firebase &amp; Vault Storage...</span>
                <span className="material-symbols-outlined text-[14px]">settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center Zone: Quick Search / Command Palette Trigger */}
      <div className="flex items-center justify-center flex-1 max-w-md mx-space-lg">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Quick Search files or commands"
          className="w-full flex items-center justify-between px-space-md py-1.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-outline hover:text-on-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="font-body-sm text-body-sm text-outline whitespace-nowrap">
              Quick Search files or commands...
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="font-code-inline text-code-inline bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant/40 text-[11px]">
              Cmd
            </kbd>
            <kbd className="font-code-inline text-code-inline bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant/40 text-[11px]">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Zone: Workspace Mode Shortcuts + Firebase Sync Indicator + Profile */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs text-outline-variant">
          <button
            type="button"
            onClick={onOpenPresentationDeck}
            title="Project Presentation Deck (11 Slides PPTX)"
            aria-label="Project Presentation Deck"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131b2e] hover:bg-[#222a3d] text-[#4edea3] border border-[#4edea3]/40 transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">
              slideshow
            </span>
            <span className="font-label-sm text-[11px] font-semibold hidden md:inline whitespace-nowrap">
              Presentation Deck
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenThinkingModal}
            title="High-Thinking Synthesis (gemini-4-argon)"
            aria-label="High-Thinking Synthesis"
            className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-primary border border-primary/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              network_intelligence
            </span>
            <span className="font-label-sm text-[11px] hidden xl:inline whitespace-nowrap">
              Deep Think
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('graph-view')}
            title="Graph View"
            aria-label="Graph View"
            className={`p-1.5 rounded hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer ${
              activeView === 'graph-view'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectView('canvas-view')}
            title="Canvas Board"
            aria-label="Canvas Board"
            className={`p-1.5 rounded hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer ${
              activeView === 'canvas-view'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              space_dashboard
            </span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-outline-variant/40" />

        {/* Firebase Firestore Cloud Connectivity Button / Status */}
        {firebaseUser ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectView('vault-settings')}
              title={`Connected to Firebase Firestore as ${firebaseUser.email || firebaseUser.displayName || 'Authenticated User'}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container/20 hover:bg-secondary-container/30 border border-secondary/30 text-secondary transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
              <span className="font-label-sm text-[11px] font-medium whitespace-nowrap">
                {syncStatusText}
              </span>
            </button>
            {onSignOutFirebase && (
              <button
                type="button"
                onClick={onSignOutFirebase}
                title="Disconnect Firebase Cloud Sync"
                aria-label="Disconnect Firebase Cloud Sync"
                className="p-1 rounded bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  logout
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                {syncStatusText}
              </span>
            </div>
            {onSignInFirebase && (
              <button
                type="button"
                onClick={onSignInFirebase}
                aria-label="Connect Firebase Cloud Sync"
                title="Sign in with Google to sync notes with Firebase Firestore"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-primary/40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">
                  cloud_sync
                </span>
                <span className="font-label-sm text-[11px] font-medium whitespace-nowrap">
                  Connect Firebase
                </span>
              </button>
            )}
          </div>
        )}

        <div className="h-4 w-[1px] bg-outline-variant/40" />

        {firebaseUser?.photoURL && !avatarError ? (
          <img
            alt={firebaseUser.displayName || 'Profile'}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-secondary/50"
            src={firebaseUser.photoURL}
            referrerPolicy="no-referrer"
            onError={() => setAvatarError(true)}
          />
        ) : !avatarError ? (
          <img
            alt="Profile"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-outline-variant/40"
            src={AVATAR_URL}
            referrerPolicy="no-referrer"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div
            aria-label="Profile"
            className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-xs font-medium ring-1 ring-outline-variant/40"
          >
            {firebaseUser?.displayName
              ? firebaseUser.displayName.slice(0, 2).toUpperCase()
              : 'EK'}
          </div>
        )}
      </div>
    </header>
  );
};

