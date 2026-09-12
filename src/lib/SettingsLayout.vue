<template>
  <div class="cfg-root">
    <!-- 日历分区 -->
    <section class="cfg-section">
      <header class="cfg-section-head">
        <span class="cfg-section-title">{{ sectionCalendar }}</span>
      </header>
      <div class="cfg-card">
        <div class="cfg-row cfg-row--block">
          <div class="cfg-row-label">{{ positionTitle }}</div>
          <div class="cfg-row-body"><SySelect /></div>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-label">{{ weekStartTitle }}</div>
          <div class="cfg-row-action"><WeekStartSelect /></div>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-label">{{ showWeekNumTitle }}</div>
          <div class="cfg-row-action"><ShowWeekNumToggle /></div>
        </div>
      </div>
    </section>

    <!-- 周记分区 -->
    <section class="cfg-section">
      <header class="cfg-section-head">
        <span class="cfg-section-title">{{ sectionWeekly }}</span>
      </header>
      <div class="cfg-card">
        <div class="cfg-row">
          <div class="cfg-row-label">{{ weeklyEnableTitle }}</div>
          <div class="cfg-row-action"><WeeklySettings /></div>
        </div>
        <div class="cfg-row cfg-row--block cfg-row--unpadded">
          <WeeklyNoteGroup />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { i18n } from '@/hooks/useSiYuan';
import { computed } from 'vue';
import SySelect from './SySelect.vue';
import WeekStartSelect from './WeekStartSelect.vue';
import ShowWeekNumToggle from './ShowWeekNumToggle.vue';
import WeeklySettings from './WeeklySettings.vue';
import WeeklyNoteGroup from './WeeklyNoteGroup.vue';

const sectionCalendar = computed(() => i18n.value?.setting?.sectionCalendar || 'Calendar');
const sectionWeekly = computed(() => i18n.value?.setting?.sectionWeekly || 'Weekly Notes');
const positionTitle = computed(() => i18n.value?.position?.title || 'Position');
const weekStartTitle = computed(() => i18n.value?.weekStart?.title || 'Week starts on');
const showWeekNumTitle = computed(() => i18n.value?.showWeekNum?.title || 'Show week number');
const weeklyEnableTitle = computed(() => i18n.value?.weekly?.enable || 'Enable weekly notes');
</script>

<style scoped>
.cfg-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
  padding: 4px 0 8px;
}

.cfg-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cfg-section-head {
  padding: 0 4px;
}

.cfg-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--b3-theme-on-surface);
  opacity: 0.55;
}

.cfg-card {
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--b3-theme-background);
}

.cfg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  transition: background-color 0.15s;
}

.cfg-row:last-child {
  border-bottom: none;
}

.cfg-row:hover {
  background-color: var(--b3-list-hover);
}

/* 块级行：标签在上，控件在下，占满宽度 */
.cfg-row--block {
  flex-direction: column;
  align-items: stretch;
}

.cfg-row--block .cfg-row-label {
  padding-bottom: 6px;
}

.cfg-row--unpadded {
  padding: 12px 16px 14px;
}

.cfg-row-label {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
  flex: 1;
  line-height: 1.4;
}

.cfg-row-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.cfg-row-body {
  width: 100%;
}
</style>
