<template>
  <div
    class="position-group"
    role="group"
    :aria-label="i18n.value?.position?.title || 'Position'"
  >
    <div v-if="hint" class="position-hint">{{ hint }}</div>

    <div class="position-chips">
      <label
        v-for="{ value, text } in options"
        :key="value"
        class="position-chip"
        :class="{ 'position-chip--active': isChecked(value) }"
      >
        <span class="position-chip-text">{{ text }}</span>
        <input
          type="checkbox"
          class="b3-switch"
          :checked="isChecked(value)"
          @change="toggle(value, ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { position, i18n } from '@/hooks/useSiYuan';
import { computed } from 'vue';

const positionText = computed(() => {
  return (
    i18n.value?.position || {
      topLeft: 'Top Left',
      topRight: 'Top Right',
      dock: 'Dock',
    }
  );
});

const hint = computed(() => i18n.value?.position?.hint || '');

const options = computed(() => [
  { value: 'top-left', text: positionText.value.topLeft },
  { value: 'top-right', text: positionText.value.topRight },
  { value: 'dock', text: positionText.value.dock },
]);

function isChecked(value: string): boolean {
  return Array.isArray(position.value) && position.value.includes(value);
}

function toggle(value: string, checked: boolean) {
  const cur = Array.isArray(position.value) ? [...position.value] : [];
  if (checked) {
    if (!cur.includes(value)) cur.push(value);
    // 顶栏左/右互斥：选中其一时移除另一个
    if (value === 'top-left') {
      const i = cur.indexOf('top-right');
      if (i >= 0) cur.splice(i, 1);
    } else if (value === 'top-right') {
      const i = cur.indexOf('top-left');
      if (i >= 0) cur.splice(i, 1);
    }
  } else {
    const i = cur.indexOf(value);
    if (i >= 0) cur.splice(i, 1);
  }
  position.value = cur;
}
</script>

<style scoped>
.position-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.position-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--b3-theme-on-surface);
  opacity: 0.6;
  white-space: normal;
}

.position-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.position-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background-color: var(--b3-theme-background);
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, background-color 0.15s;
}

.position-chip:hover {
  border-color: var(--b3-theme-primary, rgb(53, 117, 240));
}

.position-chip--active {
  border-color: var(--b3-theme-primary, rgb(53, 117, 240));
  background-color: var(--b3-theme-primary-lightest, rgba(53, 117, 240, 0.08));
}

.position-chip-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  white-space: nowrap;
}

.b3-switch {
  cursor: pointer;
}
</style>
