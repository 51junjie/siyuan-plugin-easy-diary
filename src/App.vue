<template>
  <a-config-provider :locale="configLocale">
    <a-layout>
      <a-layout-header class="header">
        <div class="tab-title-box" role="tablist">
          <TransitionGroup name="tab" tag="div" class="tab-list">
          <button
            class="tab-title"
            v-for="(notebookId, index) in selectNotebookIds"
            :key="notebookId"
            :class="{ active: notebookId === selectNotebookId }"
            role="tab"
            :aria-selected="notebookId === selectNotebookId"
            type="button"
            @click="changeNotebook(notebookId)"
          >
            <span class="tab-title-text">{{ getNotebookName(notebookId) }}</span>
          </button>
          </TransitionGroup>
        </div>
        <div class="select-container">
          <transition name="slide">
            <div
              v-if="showSelect"
              class="notebook-picker"
              @click.stop
            >
              <div class="picker-header">
                <span>显示笔记本</span>
                <span class="picker-count">{{ selectNotebookIds.length }}/3</span>
              </div>
              <div class="picker-options">
                <button
                  v-for="notebook in cusNotebooks"
                  :key="notebook.id"
                  type="button"
                  class="picker-option"
                  :class="{ selected: selectNotebookIds.includes(notebook.id) }"
                  :disabled="selectNotebookIds.length >= 3 && !selectNotebookIds.includes(notebook.id)"
                  :aria-pressed="selectNotebookIds.includes(notebook.id)"
                  @click="toggleNotebookSelection(notebook.id)"
                >
                  <span class="option-check" aria-hidden="true"></span>
                  <span class="option-name">{{ notebook.name }}</span>
                </button>
                <div v-if="cusNotebooks.length === 0" class="picker-empty">
                  暂无笔记本
                </div>
              </div>
            </div>
          </transition>
          <button
            class="toggle-btn"
            :class="{ active: showSelect }"
            :aria-label="showSelect ? '隐藏笔记本选择' : '显示笔记本选择'"
            @click.stop="showSelect = !showSelect"
          >
            <span class="icon" aria-hidden="true"></span>
          </button>
        </div>
      </a-layout-header>
      <a-layout-content class="calendar-content">
        <Transition name="calendar-scale" mode="out-in">
          <div v-if="activeNotebook" :key="activeNotebook.id" class="calendar-panel">
            <CalendarView :notebook="activeNotebook" />
          </div>
        </Transition>
      </a-layout-content>
    </a-layout>
  </a-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { Constants } from 'siyuan';
import CalendarView from '@/components/CalendarView.vue';
import { lsNotebooks, pushErrMsg, request } from '@/api/api';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { eventBus, pluginStorage, weekStart } from '@/hooks/useSiYuan';
import { CusNotebook } from '@/utils/notebook';
import { refreshSql } from './api/utils';

const STORAGE_KEY = 'arco-calendar-entry';
const SELECTED_NOTEBOOK_KEY = 'selectedNotebookId';
const SELECTED_NOTEBOOKS_KEY = 'selectedNotebookIds';
const COMMON_SELECTED_NOTEBOOK_KEY = 'local-dailynoteid';
const COMMON_SELECTED_NOTEBOOKS_KEY = 'local-dailynoteids';

const { locale, localeType } = useLocale();
const configLocale = computed(() => {
  try {
    const base = locale.value || {};
    return Object.assign({}, base, { weekStart: Number(weekStart.value) });
  } catch (e) {
    return locale.value;
  }
});

// 获取笔记本列表
const cusNotebooks = ref<CusNotebook[]>([]);
const selectNotebookId = ref<NotebookId | undefined>(undefined);
const selectNotebookIds = ref<NotebookId[]>([]);
const isInit = ref(false);
const showSelect = ref(false);

function toggleNotebookSelection(notebookId: NotebookId) {
  if (selectNotebookIds.value.includes(notebookId)) {
    handleNotebookSelectionChange(selectNotebookIds.value.filter(id => id !== notebookId));
    return;
  }
  if (selectNotebookIds.value.length < 3) {
    handleNotebookSelectionChange([...selectNotebookIds.value, notebookId]);
  }
}

function closeNotebookPicker() {
  showSelect.value = false;
}

onMounted(() => document.addEventListener('click', closeNotebookPicker));

// 下拉多选直接决定显示的 Tab，最多保留 3 个笔记本。
function handleNotebookSelectionChange(value: string[]) {
  const nextIds = value.filter(id => cusNotebooks.value.some(book => book.id === id)).slice(0, 3);
  selectNotebookIds.value = nextIds;

  if (selectNotebookId.value && !nextIds.includes(selectNotebookId.value)) {
    selectNotebookId.value = nextIds[0];
  }
  if (!selectNotebookId.value && nextIds.length > 0) {
    selectNotebookId.value = nextIds[0];
  }
  saveSelectNotebookIds();
  saveSelectedNotebookId();
}

// 保存 selectNotebookIds 到 storage
async function saveSelectNotebookIds() {
  try {
    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: COMMON_SELECTED_NOTEBOOKS_KEY,
      val: JSON.stringify(selectNotebookIds.value),
    });
  } catch (error) {
    console.warn('[calendar] failed to save selected notebooks', error);
  }
}

async function saveSelectedNotebookId() {
  try {
    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: COMMON_SELECTED_NOTEBOOK_KEY,
      val: selectNotebookId.value || '',
    });
  } catch (error) {
    console.warn('[calendar] failed to save active notebook', error);
  }
}

// 创建笔记本 Map，提升查找性能 O(1)
const notebookMap = computed(() => {
  const map = new Map<NotebookId, CusNotebook>();
  cusNotebooks.value.forEach(book => {
    map.set(book.id, book);
  });
  return map;
});

const activeNotebook = computed(() => {
  const activeId = selectNotebookId.value || selectNotebookIds.value[0] || cusNotebooks.value[0]?.id;
  return activeId ? notebookMap.value.get(activeId) : undefined;
});

// 根据笔记本 ID 获取笔记本名称
function getNotebookName(notebookId: NotebookId): string {
  const notebook = notebookMap.value.get(notebookId);
  return notebook ? notebook.name : notebookId;
}

// 根据笔记本 ID 获取笔记本对象
function getNotebookById(notebookId: NotebookId): CusNotebook | undefined {
  return notebookMap.value.get(notebookId);
}

async function init() {
  if (isInit.value) {
    return;
  }
  try {
    isInit.value = true;
    
    const { notebooks } = await lsNotebooks();
    const books = notebooks.filter((book: Notebook) => !book.closed);
    
    const builtNotebooks = await Promise.all(
      books.map(book => CusNotebook.build(book))
    );
    cusNotebooks.value = builtNotebooks;
    
    const pluginData = (await pluginStorage.value?.loadData<Record<string, unknown>>(STORAGE_KEY)) || {};
    let commonStorage: Record<string, unknown> = {};
    try {
      commonStorage = (await request<Record<string, unknown>>('/api/storage/getLocalStorage')) || {};
    } catch (error) {
      console.warn('[calendar] failed to load common storage, using plugin storage', error);
    }
    const storage = { ...pluginData, ...commonStorage };
    
    const savedNotebookId = storage[COMMON_SELECTED_NOTEBOOK_KEY] || storage[SELECTED_NOTEBOOK_KEY];
    if (typeof savedNotebookId === 'string' && cusNotebooks.value.some(book => book.id === savedNotebookId)) {
      selectNotebookId.value = savedNotebookId;
    } else {
      selectNotebookId.value = cusNotebooks.value[0]?.id;
    }
    
    let savedNotebookIds: unknown = storage[COMMON_SELECTED_NOTEBOOKS_KEY];
    if (typeof savedNotebookIds === 'string') {
      try {
        savedNotebookIds = JSON.parse(savedNotebookIds);
      } catch {
        savedNotebookIds = undefined;
      }
    }
    if (!Array.isArray(savedNotebookIds)) savedNotebookIds = storage[SELECTED_NOTEBOOKS_KEY];
    if (Array.isArray(savedNotebookIds)) {
      try {
        const savedIds = savedNotebookIds;
        selectNotebookIds.value = savedIds.filter(
          (id): id is string => typeof id === 'string' && cusNotebooks.value.some(book => book.id === id)
        );
      } catch {
        selectNotebookIds.value = [];
      }
    } else {
      selectNotebookIds.value = selectNotebookId.value ? [selectNotebookId.value] : [];
    }
    
    if (selectNotebookIds.value.length === 0 && selectNotebookId.value) {
      selectNotebookIds.value = [selectNotebookId.value];
      await saveSelectNotebookIds();
    }
    if (!selectNotebookIds.value.includes(selectNotebookId.value || '')) {
      selectNotebookId.value = selectNotebookIds.value[0];
    }
  } catch (error) {
    console.error('Failed to initialize notebooks:', error);
    if (error instanceof Error) {
      await pushErrMsg(formatMsg('initFailed') || error.message);
    }
  } finally {
    isInit.value = false;
  }
}
init();

const handleWsMain = async ({ detail }: { detail: { cmd: string } }) => {
  const { cmd } = detail;
  if (['createnotebook', 'mount', 'unmount'].includes(cmd)) {
    await refreshSql();
    cusNotebooks.value = [];
    await init();
  }
};

eventBus.value?.on('ws-main', handleWsMain);

onUnmounted(() => {
  eventBus.value?.off('ws-main', handleWsMain);
  document.removeEventListener('click', closeNotebookPicker);
});

watch(selectNotebookId, async bookId => {
  if (!bookId) {
    return;
  }
  if (selectNotebookIds.value.includes(bookId)) await saveSelectedNotebookId();
});

// 切换笔记本
function changeNotebook(notebookId: NotebookId) {
  selectNotebookId.value = notebookId;
  saveSelectedNotebookId();
}

// weekStart is managed by plugin settings; no local storage writes here.
</script>

<style scoped lang="less">
.select-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;

  .notebook-picker {
    width: min(220px, calc(100vw - 48px));
    position: absolute;
    right: 36px;
    top: calc(100% + 8px);
    z-index: 1000;
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: var(--b3-menu-background);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);

    .picker-header {
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      border-bottom: 1px solid var(--b3-border-color);
      color: var(--b3-theme-on-surface);
      font-size: 12px;
      font-weight: 600;
    }

    .picker-count {
      color: var(--b3-theme-primary);
      font-variant-numeric: tabular-nums;
    }

    .picker-options {
      max-height: 240px;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 5px;
      scrollbar-width: thin;
    }

    .picker-option {
      width: 100%;
      min-height: 34px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--b3-theme-on-surface);
      text-align: left;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--b3-list-hover);
      }

      &.selected {
        color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-lightest);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }
    }

    .option-check {
      width: 15px;
      height: 15px;
      flex: 0 0 15px;
      position: relative;
      box-sizing: border-box;
      border: 1px solid var(--b3-border-color);
      border-radius: 3px;
      background: var(--b3-theme-background);
    }

    .picker-option.selected .option-check {
      border-color: var(--b3-theme-primary);
      background: var(--b3-theme-primary);

      &::after {
        content: '';
        width: 6px;
        height: 3px;
        position: absolute;
        left: 3px;
        top: 3px;
        border-left: 2px solid var(--b3-theme-on-primary);
        border-bottom: 2px solid var(--b3-theme-on-primary);
        transform: rotate(-45deg);
      }
    }

    .option-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }

    .picker-empty {
      padding: 18px 8px;
      color: var(--b3-theme-on-surface-light);
      font-size: 13px;
      text-align: center;
    }
  }

  .toggle-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background-color: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    cursor: pointer;

    &:hover,
    &.active {
      color: var(--b3-theme-primary);
    }

    .icon {
      width: 14px;
      height: 14px;
      position: relative;

      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 11px;
        height: 2px;
        border-radius: 1px;
        background: currentColor;
        transform: translate(-50%, -50%);
      }

      &::after {
        transform: translate(-50%, -50%) rotate(90deg);
      }
    }
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
  transform-origin: right center;
  will-change: transform, opacity;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

// 标签页标题样式
.header{
  padding: 6px !important;
  position: relative;
  z-index: 10;
  min-width: 0;
  overflow: visible;
}
.calendar-content {
  min-width: 0;
  overflow-x: hidden;
}
.tab-title-box {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 2px 4px;
  background: var(--b3-theme-surface);
  border: 0;
  border-radius: 6px;
  box-sizing: border-box;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-list {
  display: flex;
  align-items: stretch;
  gap: 2px;
  min-width: max-content;
}

.tab-title {
  display: flex;
  align-items: center;
  position: relative;
  min-height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;

  &:hover {
    background: var(--b3-list-hover);
  }

  .tab-title-text {
    font-size: 14px;
    white-space: nowrap;
  }
}

.tab-title.active {
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-lightest);

  &::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 2px;
    border-radius: 2px;
    background: var(--b3-theme-primary);
  }

  .tab-title-text { font-weight: 600; }
}

.tab-enter-active,
.tab-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tab-enter-from,
.tab-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.tab-move { transition: transform 0.18s ease; }

.calendar-panel {
  height: 100%;
  min-width: 0;
}

.calendar-scale-enter-active,
.calendar-scale-leave-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
  will-change: transform, opacity;
}

.calendar-scale-enter-from,
.calendar-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

// 布局头部样式
:deep(.arco-layout-header) {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}
</style>
