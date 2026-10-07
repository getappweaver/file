import type { PluginLandingDefinition } from '../../apps/landing/content-types';

export const landingPage: PluginLandingDefinition = {
  route: '/apps/file-manager',
  name: 'File Manager',
  shortName: 'File',
  description:
    'Browse workspace trees and inspect project files from AppWeaver.',
  features: [
    'Browse workspace trees without leaving the AppWeaver UI.',
    'Read local project documentation and inspect source files before editing code.',
    'Review git diffs in the UI so you can check what changed before moving on.',
  ],
  hasInteractiveDemo: true,
  installScreenshot: 'landing/assets/file-manager.png',
  assetAliases: [
    {
      source: 'landing/assets/overview.png',
      publicPath: '/screenshots/file.png',
    },
  ],
  demoStories: [
    {
      id: 'file-edit-diff',
      label: 'Edit a file and inspect the diff',
      variants: [
        {
          view: 'desktop',
          src: 'landing/assets/file-edit-diff.gif',
          alt: 'File Manager opening a markdown file, editing it, and reviewing the diff',
          durationMs: 29760,
        },
        {
          view: 'mobile',
          src: 'landing/assets/file-edit-diff-mobile.gif',
          alt: 'File Manager mobile view editing a file and opening the diff',
          durationMs: 37260,
        },
      ],
    },
    {
      id: 'file-diff-commit',
      label: 'Review all your file changes and commit',
      variants: [
        {
          view: 'desktop',
          src: 'landing/assets/file-diff-commit.gif',
          alt: 'Review your changes in one place, and commit',
          durationMs: 33260,
        },
        {
          view: 'mobile',
          src: 'landing/assets/file-diff-commit-mobile.gif',
          alt: 'Review your changes in mobile view in one place, and commit',
          durationMs: 50630,
        },
      ],
    },
    {
      id: 'file-commit-history',
      label: 'Check your file commit history',
      variants: [
        {
          view: 'desktop',
          src: 'landing/assets/file-commit-history.gif',
          alt: 'See all your commit history in a folder',
          durationMs: 30380,
        },
        {
          view: 'mobile',
          src: 'landing/assets/file-commit-history-mobile.gif',
          alt: 'See all your commit history in a folder on mobile',
          durationMs: 39760,
        },
      ],
    },
  ],
  presentation: null,
  roadmapRepoId: 'file',
};
