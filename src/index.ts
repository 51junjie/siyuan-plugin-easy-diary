import App from './App.vue';
import { createApp } from 'vue';
import { Plugin, Menu, Setting, getFrontend, showMessage } from 'siyuan';
import { app, i18n, isMobile, eventBus, pluginStorage, position, weekStart, showWeekNum, weeklyEnabled, weeklyPath, weeklyTemplatePath, refreshTrigger } from './hooks/useSiYuan';
import SettingsLayout from './lib/SettingsLayout.vue';
import './index.less';

const STORAGE_NAME = 'arco-calendar-entry';

export default class ArcoCalendarPlugin extends Plugin {
  private topEles: HTMLElement[] = [];

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;
    pluginStorage.value = {
      loadData: this.loadData.bind(this),
      saveData: this.saveData.bind(this),
    };
    isMobile.value = ['mobile', 'browser-mobile'].includes(getFrontend());
    this.init();
  }

  onunload() {
    console.log(this.i18n.byePlugin);
    this.topEles.forEach(el => el?.remove());
    this.topEles = [];
    pluginStorage.value = undefined;
  }

  private async init() {
    const data = await this.loadData(STORAGE_NAME);
    if (!data) {
      await this.saveData(STORAGE_NAME, { position: ['top-left'], weekStart: 1, showWeekNum: false, weeklyEnabled: false, weeklyPath: '', weeklyTemplatePath: '' });
      await this.loadData(STORAGE_NAME);
      position.value = ['top-left'];
      weekStart.value = 1;
      showWeekNum.value = false;
      weeklyEnabled.value = false;
      weeklyPath.value = '';
      weeklyTemplatePath.value = '';
    } else {
      // 兼容旧版单值字符串：转为数组
      const rawPosition = data.position;
      if (Array.isArray(rawPosition)) {
        position.value = [...rawPosition];
      } else if (typeof rawPosition === 'string' && rawPosition) {
        position.value = [rawPosition];
      } else {
        position.value = ['top-left'];
      }
      if (data.weekStart !== undefined) {
        weekStart.value = Number(data.weekStart);
      }
      if (data.showWeekNum !== undefined) {
        showWeekNum.value = Boolean(data.showWeekNum);
      }
      if (data.weeklyEnabled !== undefined) {
        weeklyEnabled.value = Boolean(data.weeklyEnabled);
      }
      if (data.weeklyPath !== undefined) {
        weeklyPath.value = String(data.weeklyPath);
      }
      if (data.weeklyTemplatePath !== undefined) {
        weeklyTemplatePath.value = String(data.weeklyTemplatePath);
      }
    }
    // 按固定顺序挂载入口，避免不同设置下顺序跳变
    const positions = Array.isArray(position.value) ? position.value : [];
    if (positions.includes('top-left')) {
      this.addTopItem('left');
    }
    if (positions.includes('top-right')) {
      this.addTopItem('right');
    }
    if (positions.includes('dock')) {
      this.addDockItem();
    }
    this.initSetting();
  }
  
  private initSetting() {
    this.setting = new Setting({
      height: 'auto',
      width: '560px',
      confirmCallback: async () => {
        const saveObj: any = {
          position: Array.isArray(position.value) ? [...position.value] : [],
          weekStart: Number(weekStart.value),
          showWeekNum: showWeekNum.value,
          weeklyEnabled: weeklyEnabled.value,
          weeklyPath: weeklyPath.value,
          weeklyTemplatePath: weeklyTemplatePath.value,
        };
        await this.saveData(STORAGE_NAME, saveObj);
        window.location.reload();
      },
    });

    // 单一全宽布局组件，内部自行渲染分区卡片
    const layoutEle = document.createElement('div');
    layoutEle.style.width = '100%';
    createApp(SettingsLayout).mount(layoutEle);
    this.setting.addItem({
      title: '',
      actionElement: layoutEle,
    });
  }

  private addTopItem(direction: 'left' | 'right') {
    const menuEle = document.createElement('div');
    createApp(App).mount(menuEle);
    const topEle = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: direction,
      callback: () => {
        // 每次打开弹窗时触发刷新信号
        refreshTrigger.value++;

        let rect = topEle.getBoundingClientRect();
        // 如果被隐藏，则使用更多按钮
        if (rect.width === 0) {
          const barMore = document.querySelector('#barMore');
          if (barMore) rect = barMore.getBoundingClientRect();
        }
        const menu = new Menu('Calendar');
        menu.addItem({ element: menuEle });
        if (isMobile.value) {
          menu.fullscreen();
        } else {
          menu.open({
            x: rect[direction],
            y: rect.bottom,
            isLeft: direction !== 'left',
          });
        }
      },
    });
    this.topEles.push(topEle);
  }

  private addDockItem() {
    const _plugin = this;
    this.addDock({
      config: {
        position: 'RightTop',
        size: { width: 300, height: 0 },
        icon: 'iconCalendar',
        title: _plugin.i18n.tabName,
      },
      data: {},
      type: 'dock_tab',
      init: dock => {
        createApp(App).mount(dock.element);
      },
    });
  }

    uninstall() {
        // 卸载插件时删除插件数据
        // Delete plugin data when uninstalling the plugin
        this.removeData(STORAGE_NAME).catch(e => {
            showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
        });
    }
}
