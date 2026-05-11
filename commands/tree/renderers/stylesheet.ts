import type { WebStyleSheet } from '@src/web/ui-schema';

import {
  fileBreadcrumbCss,
  fileOpenTimelineButtonCss,
} from '../../shared/web-breadcrumb';

export const filePluginTreeStylesheet: WebStyleSheet = {
  id: 'file-plugin-tree',
  cssText: `
.web-file-tree-modal-layout.web-stack {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.web-file-tree-modal-layout > .web-box.web-file-tree-block {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.web-file-tree-modal-layout > .web-row.web-file-tree-controls {
  flex-shrink: 0;
}

.web-file-tree-block {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0.35rem 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow-x: auto;
}

.web-file-tree-block > .web-node.web-tree {
  gap: 0.06rem;
}

.web-file-tree-children.web-stack {
  gap: 0.06rem;
}

.web-file-tree-line.web-row {
  gap: 0.35rem;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
}

.web-file-tree-glyph-line {
  white-space: pre;
  user-select: none;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.78;
}

.web-file-tree-link-wrap {
  min-width: 0;
}

.web-file-tree-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
}

.web-file-tree-controls.web-row {
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.web-file-tree-breadcrumb {
  flex: 1;
}

.web-file-tree-nav-sep {
  opacity: 0.45;
  user-select: none;
}

.web-button.web-file-advanced-search-button,
.web-button.web-file-timeline-diff-button,
.web-button.web-file-history-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.55rem;
  height: 1.45rem;
  min-height: 0;
  padding: 0 !important;
  border: 1px solid #000;
  border-radius: 0;
  background: color-mix(in srgb, var(--color-accent, #8ecae6) 86%, transparent) !important;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  color: #000;
  font-size: 0;
  line-height: 1;
  transform: none;
}

.web-button.web-file-advanced-search-button::before,
.web-button.web-file-timeline-diff-button::before,
.web-button.web-file-history-button::before {
  content: '';
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  background: currentColor;
}

.web-button.web-file-advanced-search-button::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14,6v6H10.66718a3.66156,3.66156,0,0,0,.24884-1.30225A3.70117,3.70117,0,0,0,7.21973,7,3.65379,3.65379,0,0,0,6,7.22308V2h4V6ZM11,2V5h3ZM9.87445,10.69754a2.69732,2.69732,0,0,1-4.73038,1.77284L2.52149,14l-.47964-.823,2.61261-1.52332a2.69756,2.69756,0,1,1,5.22-.95614Zm-.95195,0a1.74533,1.74533,0,1,0-1.74506,1.74558A1.74723,1.74723,0,0,0,8.9225,10.69754Z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14,6v6H10.66718a3.66156,3.66156,0,0,0,.24884-1.30225A3.70117,3.70117,0,0,0,7.21973,7,3.65379,3.65379,0,0,0,6,7.22308V2h4V6ZM11,2V5h3ZM9.87445,10.69754a2.69732,2.69732,0,0,1-4.73038,1.77284L2.52149,14l-.47964-.823,2.61261-1.52332a2.69756,2.69756,0,1,1,5.22-.95614Zm-.95195,0a1.74533,1.74533,0,1,0-1.74506,1.74558A1.74723,1.74723,0,0,0,8.9225,10.69754Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-advanced-search-button:hover,
.web-button.web-file-timeline-diff-button:hover,
.web-button.web-file-history-button:hover,
.web-button.web-file-timeline-diff-button:focus-visible,
.web-button.web-file-history-button:focus-visible,
.web-button.web-file-advanced-search-button:focus-visible {
  background: var(--color-accent, #8ecae6) !important;
  color: #000;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: none;
}

.web-button.web-file-advanced-search-button:active,
.web-button.web-file-timeline-diff-button:active,
.web-button.web-file-history-button:active {
  background: color-mix(in srgb, var(--color-accent, #8ecae6) 72%, #000) !important;
  box-shadow: 1px 1px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: translate(2px, 2px);
}

.web-button.web-file-timeline-diff-button::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M476 399.1c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1V484h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H420v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V540h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H476v-84.9zM560.5 704h-225c-4.1 0-7.5 3.2-7.5 7v42c0 3.8 3.4 7 7.5 7h225c4.1 0 7.5-3.2 7.5-7v-42c0-3.8-3.4-7-7.5-7zm-7.1-502.6c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32V397.3c0-8.5-3.4-16.6-9.4-22.6L553.4 201.4zM664 888H232V264h282.2L664 413.8V888zm190.2-581.4L611.3 72.9c-6-5.7-13.9-8.9-22.2-8.9H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h277l219 210.6V824c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V329.6c0-8.7-3.5-17-9.8-23z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M476 399.1c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1V484h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H420v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V540h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H476v-84.9zM560.5 704h-225c-4.1 0-7.5 3.2-7.5 7v42c0 3.8 3.4 7 7.5 7h225c4.1 0 7.5-3.2 7.5-7v-42c0-3.8-3.4-7-7.5-7zm-7.1-502.6c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32V397.3c0-8.5-3.4-16.6-9.4-22.6L553.4 201.4zM664 888H232V264h282.2L664 413.8V888zm190.2-581.4L611.3 72.9c-6-5.7-13.9-8.9-22.2-8.9H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h277l219 210.6V824c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V329.6c0-8.7-3.5-17-9.8-23z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-history-button::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(85.572501, 42.666667)'%3E%3Cpath d='M236.349632 0H1.68296533V234.666667H44.349632V42.6666667H218.642965L300.349632 124.373333V234.666667H343.016299V106.666667L236.349632 0ZM0 405.333333V277.360521H28.8096875V382.755208H83.81V405.333333H0ZM153.17 275.102708C173.279583 275.102708 188.692917 281.484792 199.41 294.248958C209.705625 306.47125 214.853437 322.185625 214.853437 341.392083C214.853437 362.404792 208.772396 379.112604 196.610312 391.515521C186.134062 402.232604 171.653958 407.591146 153.17 407.591146C133.060417 407.591146 117.647083 401.209062 106.93 388.444896C96.634375 376.222604 91.4865625 360.267396 91.4865625 340.579271C91.4865625 319.988021 97.5676042 303.490937 109.729687 291.088021C120.266146 280.431146 134.74625 275.102708 153.17 275.102708ZM153.079687 297.680833C142.663646 297.680833 134.625833 302.015833 128.96625 310.685833C123.848542 318.512917 121.289687 328.567708 121.289687 340.850208C121.289687 355.059375 124.330208 366.0775 130.41125 373.904583C136.131042 381.310208 143.717292 385.013021 153.17 385.013021C163.525833 385.013021 171.59375 380.647917 177.37375 371.917708C182.491458 364.211042 185.050312 354.035833 185.050312 341.392083C185.050312 327.483958 182.009792 316.616354 175.92875 308.789271C170.208958 301.383646 162.592604 297.680833 153.079687 297.680833ZM343.91 333.715521V399.011458C336.564583 401.48 331.386667 403.105625 328.37625 403.888333C319.043958 406.356875 309.019271 407.591146 298.302187 407.591146C277.229271 407.591146 261.18375 402.292812 250.165625 391.696146C237.943333 380.015729 231.832187 363.729375 231.832187 342.837083C231.832187 318.813958 239.418437 300.69125 254.590937 288.468958C265.609062 279.558125 280.480521 275.102708 299.205312 275.102708C315.220729 275.102708 330.122292 278.022812 343.91 283.863021L334.065937 306.350833C327.563437 303.099583 321.87375 300.826719 316.996875 299.53224C312.12 298.23776 306.761458 297.590521 300.92125 297.590521C286.952917 297.590521 276.657292 302.13625 270.034375 311.227708C264.435 318.934375 261.635312 329.079479 261.635312 341.663021C261.635312 356.775312 265.849896 368.154687 274.279062 375.801146C281.022396 381.942396 289.391354 385.013021 299.385937 385.013021C305.226146 385.013021 310.765312 384.019583 316.003437 382.032708V356.293646H293.967187V333.715521H343.91Z'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(85.572501, 42.666667)'%3E%3Cpath d='M236.349632 0H1.68296533V234.666667H44.349632V42.6666667H218.642965L300.349632 124.373333V234.666667H343.016299V106.666667L236.349632 0ZM0 405.333333V277.360521H28.8096875V382.755208H83.81V405.333333H0ZM153.17 275.102708C173.279583 275.102708 188.692917 281.484792 199.41 294.248958C209.705625 306.47125 214.853437 322.185625 214.853437 341.392083C214.853437 362.404792 208.772396 379.112604 196.610312 391.515521C186.134062 402.232604 171.653958 407.591146 153.17 407.591146C133.060417 407.591146 117.647083 401.209062 106.93 388.444896C96.634375 376.222604 91.4865625 360.267396 91.4865625 340.579271C91.4865625 319.988021 97.5676042 303.490937 109.729687 291.088021C120.266146 280.431146 134.74625 275.102708 153.17 275.102708ZM153.079687 297.680833C142.663646 297.680833 134.625833 302.015833 128.96625 310.685833C123.848542 318.512917 121.289687 328.567708 121.289687 340.850208C121.289687 355.059375 124.330208 366.0775 130.41125 373.904583C136.131042 381.310208 143.717292 385.013021 153.17 385.013021C163.525833 385.013021 171.59375 380.647917 177.37375 371.917708C182.491458 364.211042 185.050312 354.035833 185.050312 341.392083C185.050312 327.483958 182.009792 316.616354 175.92875 308.789271C170.208958 301.383646 162.592604 297.680833 153.079687 297.680833ZM343.91 333.715521V399.011458C336.564583 401.48 331.386667 403.105625 328.37625 403.888333C319.043958 406.356875 309.019271 407.591146 298.302187 407.591146C277.229271 407.591146 261.18375 402.292812 250.165625 391.696146C237.943333 380.015729 231.832187 363.729375 231.832187 342.837083C231.832187 318.813958 239.418437 300.69125 254.590937 288.468958C265.609062 279.558125 280.480521 275.102708 299.205312 275.102708C315.220729 275.102708 330.122292 278.022812 343.91 283.863021L334.065937 306.350833C327.563437 303.099583 321.87375 300.826719 316.996875 299.53224C312.12 298.23776 306.761458 297.590521 300.92125 297.590521C286.952917 297.590521 276.657292 302.13625 270.034375 311.227708C264.435 318.934375 261.635312 329.079479 261.635312 341.663021C261.635312 356.775312 265.849896 368.154687 274.279062 375.801146C281.022396 381.942396 289.391354 385.013021 299.385937 385.013021C305.226146 385.013021 310.765312 384.019583 316.003437 382.032708V356.293646H293.967187V333.715521H343.91Z'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-tree-link {
  display: block;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0;
  border: none;
  border-radius: 0;
  color: inherit;
  text-decoration: none;
  text-align: left;
  min-height: 0;
  transform: none !important;
  vertical-align: baseline;
  font: inherit;
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.web-button.web-tree-link:hover,
.web-button.web-tree-link:focus-visible {
  background: transparent !important;
  box-shadow: none !important;
  text-decoration: underline;
  transform: none !important;
}

.web-button.web-tree-link:active {
  background: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}

.web-tree-link-dir {
  color: var(--color-accent, #8ecae6);
}

.web-tree-link-file {
  color: inherit;
}

/* Git filename + badge share one tone per row (see web-file-tree-line-git-*). */
.web-tree-link-git-modified {
  color: #d7ba7d;
}

.web-tree-link-git-added,
.web-tree-link-git-untracked {
  color: #73c991;
}

.web-tree-link-git-deleted,
.web-tree-link-git-conflicted {
  color: var(--color-danger, #f48771);
}

.web-tree-link-git-renamed {
  color: var(--color-info, #75beff);
}

.web-file-tree-line.web-file-tree-line-git-modified .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-modified .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-modified .web-button.web-tree-git-badge-button {
  color: #d7ba7d;
}

.web-file-tree-line.web-file-tree-line-git-added .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-added .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-added .web-button.web-tree-git-badge-button,
.web-file-tree-line.web-file-tree-line-git-untracked .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-untracked .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-untracked .web-button.web-tree-git-badge-button {
  color: #73c991;
}

.web-file-tree-line.web-file-tree-line-git-renamed .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-renamed .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-renamed .web-button.web-tree-git-badge-button {
  color: var(--color-info, #75beff);
}

.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-deleted .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-git-badge-button,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-button.web-tree-git-badge-button {
  color: var(--color-danger, #f48771);
}

.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-link {
  text-decoration: line-through;
}

.web-file-tree-line.web-file-tree-line-git-deleted
  .web-button.web-tree-link:hover,
.web-file-tree-line.web-file-tree-line-git-deleted
  .web-button.web-tree-link:focus-visible {
  text-decoration: line-through underline;
}

.web-tree-link-nav {
  color: var(--color-text-muted, #a8a8a8);
}

.web-button.web-tree-link.web-tree-link-nav:hover,
.web-button.web-tree-link.web-tree-link-nav:focus-visible {
  color: var(--color-text);
}

.web-node.web-badge.web-tree-git-badge,
.web-button.web-tree-git-badge-button {
  flex-shrink: 0;
  min-width: 1.2rem;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  justify-content: center;
}

.web-button.web-tree-git-badge-button {
  min-height: 0;
  cursor: pointer;
}

.web-button.web-tree-git-badge-button:hover,
.web-button.web-tree-git-badge-button:focus-visible {
  text-decoration: underline;
  transform: none !important;
}

.web-tree-git-badge.web-tree-git-modified {
  color: #d7ba7d;
}

.web-tree-git-badge.web-tree-git-added,
.web-tree-git-badge.web-tree-git-untracked {
  color: #73c991;
}

.web-tree-git-badge.web-tree-git-deleted,
.web-tree-git-badge.web-tree-git-conflicted {
  color: var(--color-danger, #f48771);
}

.web-tree-git-badge.web-tree-git-renamed {
  color: var(--color-info, #75beff);
}

${fileBreadcrumbCss}

${fileOpenTimelineButtonCss}
`.trim(),
};
