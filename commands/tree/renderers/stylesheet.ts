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

.web-file-tree-item-leaf > .web-tree-item-summary > .web-tree-toggle {
  visibility: hidden;
  pointer-events: none;
}

.web-file-tree-line .web-overflow-trigger.web-file-tree-row-menu {
  opacity: 0;
  pointer-events: none;
}

.web-file-tree-line:hover .web-overflow-trigger.web-file-tree-row-menu,
.web-file-tree-line:focus-within .web-overflow-trigger.web-file-tree-row-menu,
.web-overflow-menu.is-open .web-overflow-trigger.web-file-tree-row-menu {
  opacity: 1;
  pointer-events: auto;
}

.web-file-tree-inline-form.web-form {
  margin: 0.16rem 0 0.2rem 1.6rem;
  padding: 0.35rem 0.45rem;
  background: rgba(0, 0, 0, 0.18);
}

.web-file-tree-inline-form .web-textField__input {
  min-width: min(18rem, 100%);
}

.web-file-tree-delete-form.web-form {
  border-left: 2px solid var(--color-danger, #f48771);
}

.web-button.web-file-tree-delete-menu-item {
  color: #000 !important;
}

.web-button.web-file-tree-delete-menu-item:hover,
.web-button.web-file-tree-delete-menu-item:focus-visible {
  background: var(--color-danger, #f48771) !important;
  color: #000 !important;
}

.web-button.web-file-tree-delete-submit {
  background: color-mix(in srgb, var(--color-danger, #f48771) 86%, transparent) !important;
  color: #000 !important;
}

.web-button.web-file-tree-delete-submit:hover,
.web-button.web-file-tree-delete-submit:focus-visible {
  background: var(--color-danger, #f48771) !important;
  color: #000 !important;
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

.web-button.web-file-new-file,
.web-button.web-file-new-folder,
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

.web-button.web-file-new-file::before,
.web-button.web-file-new-folder::before,
.web-button.web-file-advanced-search-button::before,
.web-button.web-file-timeline-diff-button::before,
.web-button.web-file-history-button::before {
  content: '';
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  background: currentColor;
}

.web-button.web-file-new-file::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 14C4.448 14 4 13.552 4 13V3C4 2.448 4.448 2 5 2H8V4.5C8 5.328 8.672 6 9.5 6H12V6.025C12.344 6.056 12.677 6.121 13 6.213V5.414C13 5.016 12.842 4.635 12.561 4.353L9.647 1.439C9.366 1.158 8.984 1 8.586 1H5C3.895 1 3 1.895 3 3V13C3 14.105 3.895 15 5 15H7.261C7.008 14.693 6.791 14.357 6.607 14H5ZM9 2.207L11.793 5H9.5C9.224 5 9 4.776 9 4.5V2.207ZM11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM14 12H12V14C12 14.276 11.776 14.5 11.5 14.5C11.224 14.5 11 14.276 11 14V12H9C8.724 12 8.5 11.776 8.5 11.5C8.5 11.224 8.724 11 9 11H11V9C11 8.724 11.224 8.5 11.5 8.5C11.776 8.5 12 8.724 12 9V11H14C14.276 11 14.5 11.224 14.5 11.5C14.5 11.776 14.276 12 14 12Z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 14C4.448 14 4 13.552 4 13V3C4 2.448 4.448 2 5 2H8V4.5C8 5.328 8.672 6 9.5 6H12V6.025C12.344 6.056 12.677 6.121 13 6.213V5.414C13 5.016 12.842 4.635 12.561 4.353L9.647 1.439C9.366 1.158 8.984 1 8.586 1H5C3.895 1 3 1.895 3 3V13C3 14.105 3.895 15 5 15H7.261C7.008 14.693 6.791 14.357 6.607 14H5ZM9 2.207L11.793 5H9.5C9.224 5 9 4.776 9 4.5V2.207ZM11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM14 12H12V14C12 14.276 11.776 14.5 11.5 14.5C11.224 14.5 11 14.276 11 14V12H9C8.724 12 8.5 11.776 8.5 11.5C8.5 11.224 8.724 11 9 11H11V9C11 8.724 11.224 8.5 11.5 8.5C11.776 8.5 12 8.724 12 9V11H14C14.276 11 14.5 11.224 14.5 11.5C14.5 11.776 14.276 12 14 12Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-new-folder::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4.5V6H5.58579C5.71839 6 5.84557 5.94732 5.93934 5.85355L7.29289 4.5L5.93934 3.14645C5.84557 3.05268 5.71839 3 5.58579 3H3.5C2.67157 3 2 3.67157 2 4.5ZM1 4.5C1 3.11929 2.11929 2 3.5 2H5.58579C5.98361 2 6.36514 2.15804 6.64645 2.43934L8.20711 4H12.5C13.8807 4 15 5.11929 15 6.5V7.25716C14.6929 7.00353 14.3578 6.78261 14 6.59971V6.5C14 5.67157 13.3284 5 12.5 5H8.20711L6.64645 6.56066C6.36514 6.84197 5.98361 7 5.58579 7H2V11.5C2 12.3284 2.67157 13 3.5 13H6.20703C6.30564 13.3486 6.43777 13.6832 6.59971 14H3.5C2.11929 14 1 12.8807 1 11.5V4.5ZM16 11.5C16 13.9853 13.9853 16 11.5 16C9.01472 16 7 13.9853 7 11.5C7 9.01472 9.01472 7 11.5 7C13.9853 7 16 9.01472 16 11.5ZM12 9C12 8.72386 11.7761 8.5 11.5 8.5C11.2239 8.5 11 8.72386 11 9V11H9C8.72386 11 8.5 11.2239 8.5 11.5C8.5 11.7761 8.72386 12 9 12H11V14C11 14.2761 11.2239 14.5 11.5 14.5C11.7761 14.5 12 14.2761 12 14V12H14C14.2761 12 14.5 11.7761 14.5 11.5C14.5 11.2239 14.2761 11 14 11H12V9Z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4.5V6H5.58579C5.71839 6 5.84557 5.94732 5.93934 5.85355L7.29289 4.5L5.93934 3.14645C5.84557 3.05268 5.71839 3 5.58579 3H3.5C2.67157 3 2 3.67157 2 4.5ZM1 4.5C1 3.11929 2.11929 2 3.5 2H5.58579C5.98361 2 6.36514 2.15804 6.64645 2.43934L8.20711 4H12.5C13.8807 4 15 5.11929 15 6.5V7.25716C14.6929 7.00353 14.3578 6.78261 14 6.59971V6.5C14 5.67157 13.3284 5 12.5 5H8.20711L6.64645 6.56066C6.36514 6.84197 5.98361 7 5.58579 7H2V11.5C2 12.3284 2.67157 13 3.5 13H6.20703C6.30564 13.3486 6.43777 13.6832 6.59971 14H3.5C2.11929 14 1 12.8807 1 11.5V4.5ZM16 11.5C16 13.9853 13.9853 16 11.5 16C9.01472 16 7 13.9853 7 11.5C7 9.01472 9.01472 7 11.5 7C13.9853 7 16 9.01472 16 11.5ZM12 9C12 8.72386 11.7761 8.5 11.5 8.5C11.2239 8.5 11 8.72386 11 9V11H9C8.72386 11 8.5 11.2239 8.5 11.5C8.5 11.7761 8.72386 12 9 12H11V14C11 14.2761 11.2239 14.5 11.5 14.5C11.7761 14.5 12 14.2761 12 14V12H14C14.2761 12 14.5 11.7761 14.5 11.5C14.5 11.2239 14.2761 11 14 11H12V9Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-advanced-search-button::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14,6v6H10.66718a3.66156,3.66156,0,0,0,.24884-1.30225A3.70117,3.70117,0,0,0,7.21973,7,3.65379,3.65379,0,0,0,6,7.22308V2h4V6ZM11,2V5h3ZM9.87445,10.69754a2.69732,2.69732,0,0,1-4.73038,1.77284L2.52149,14l-.47964-.823,2.61261-1.52332a2.69756,2.69756,0,1,1,5.22-.95614Zm-.95195,0a1.74533,1.74533,0,1,0-1.74506,1.74558A1.74723,1.74723,0,0,0,8.9225,10.69754Z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14,6v6H10.66718a3.66156,3.66156,0,0,0,.24884-1.30225A3.70117,3.70117,0,0,0,7.21973,7,3.65379,3.65379,0,0,0,6,7.22308V2h4V6ZM11,2V5h3ZM9.87445,10.69754a2.69732,2.69732,0,0,1-4.73038,1.77284L2.52149,14l-.47964-.823,2.61261-1.52332a2.69756,2.69756,0,1,1,5.22-.95614Zm-.95195,0a1.74533,1.74533,0,1,0-1.74506,1.74558A1.74723,1.74723,0,0,0,8.9225,10.69754Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-new-file:hover,
.web-button.web-file-new-folder:hover,
.web-button.web-file-advanced-search-button:hover,
.web-button.web-file-timeline-diff-button:hover,
.web-button.web-file-history-button:hover,
.web-button.web-file-new-file:focus-visible,
.web-button.web-file-new-folder:focus-visible,
.web-button.web-file-timeline-diff-button:focus-visible,
.web-button.web-file-history-button:focus-visible,
.web-button.web-file-advanced-search-button:focus-visible {
  background: var(--color-accent, #8ecae6) !important;
  color: #000;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: none;
}

.web-button.web-file-new-file:active,
.web-button.web-file-new-folder:active,
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
