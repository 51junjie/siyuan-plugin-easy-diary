<template>
  <div class="weekly-settings-container">
    <!-- Path Section -->
    <div class="vertical-group">
      <div class="group-label">{{ i18n.weekly?.pathLabel }}</div>
      <div v-if="i18n.weekly?.pathHint" class="hint">{{ i18n.weekly?.pathHint }}</div>
      <input
        type="text"
        class="b3-text-field"
        v-model="weeklyPath"
        placeholder="/daily note/{{now | date '2006-01'}}/{{now | date '2006'}}-W{{weekly}}"
      />
    </div>

    <!-- Template Section -->
    <div class="vertical-group">
      <div class="group-label">{{ i18n.weekly?.templateLabel }}</div>
      <div v-if="i18n.weekly?.templateHint" class="hint">{{ i18n.weekly?.templateHint }}</div>
      <input
        type="text"
        class="b3-text-field"
        v-model="weeklyTemplatePath"
        placeholder="weekly-template.md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { weeklyPath, weeklyTemplatePath, i18n } from '@/hooks/useSiYuan';
</script>

<style scoped>
.weekly-settings-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

.vertical-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.group-label {
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  font-weight: 500;
  padding: 0 0 6px 0;
  text-align: left;
}

.hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--b3-theme-on-surface);
  opacity: 0.6;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.b3-text-field {
  width: 100%;
  box-sizing: border-box;
  background-color: var(--b3-theme-background) !important;
  color: var(--b3-theme-on-surface) !important;
  border: 1px solid var(--b3-border-color);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.15s;
}

.b3-text-field:focus {
  border-color: var(--b3-theme-primary, rgb(53, 117, 240));
  outline: none;
}

.b3-text-field:hover {
  border-color: var(--b3-theme-primary-light, var(--b3-theme-primary));
}

.b3-text-field::placeholder {
  color: var(--b3-theme-on-surface);
  opacity: 0.35;
}
</style>
