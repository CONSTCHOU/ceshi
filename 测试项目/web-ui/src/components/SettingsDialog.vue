<template>
  <el-dialog
    v-model="visible"
    title="系统设置"
    width="80%"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      class="mb-4"
    />
    
    <div v-loading="loading">
      <el-tabs v-model="activeTab">
        <!-- AI 服务设置 -->
        <el-tab-pane label="AI 服务" name="ai">
          <el-form :model="settings.AI_SETTINGS" label-width="120px">
            <el-form-item label="最大重试次数">
              <el-input-number
                v-model="settings.AI_SETTINGS.MAX_RETRIES"
                :min="1"
                :max="10"
              />
            </el-form-item>
            <el-form-item label="重试延迟(ms)">
              <el-input-number
                v-model="settings.AI_SETTINGS.RETRY_DELAY"
                :min="500"
                :step="500"
              />
            </el-form-item>
            
            <!-- AI 服务配置 -->
            <el-divider>服务配置</el-divider>
            <div v-for="(service, key) in settings.AI_SETTINGS.SERVICES" :key="key">
              <el-card class="mb-4">
                <template #header>
                  <div class="flex justify-between">
                    <span>{{ key }}</span>
                    <el-switch v-model="service.ENABLED" />
                  </div>
                </template>
                <el-form-item label="优先级">
                  <el-input-number v-model="service.PRIORITY" :min="1" />
                </el-form-item>
                <el-form-item label="模型">
                  <el-input v-model="service.MODEL" />
                </el-form-item>
                <el-form-item label="最大Token">
                  <el-input-number
                    v-model="service.MAX_TOKENS"
                    :min="50"
                    :step="50"
                  />
                </el-form-item>
              </el-card>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- 选择器设置 -->
        <el-tab-pane label="选择器" name="selectors">
          <el-form :model="settings.SELECTORS" label-width="120px">
            <el-form-item label="标题选择器">
              <el-input v-model="settings.SELECTORS.TITLE" />
              <div class="text-gray-500 text-sm mt-1">
                多个选择器用逗号分隔，如：h1, .title
              </div>
            </el-form-item>
            <el-form-item label="内容选择器">
              <el-input v-model="settings.SELECTORS.CONTENT" />
            </el-form-item>
            <el-form-item label="时间选择器">
              <el-input v-model="settings.SELECTORS.TIMESTAMP" />
            </el-form-item>

            <!-- 备用选择器 -->
            <el-divider>备用选择器</el-divider>
            <div v-for="(selectors, key) in settings.SELECTORS.FALLBACK_SELECTORS" :key="key">
              <el-form-item :label="key">
                <el-select
                  v-model="settings.SELECTORS.FALLBACK_SELECTORS[key]"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="请输入选择器"
                >
                  <el-option
                    v-for="item in settings.SELECTORS.FALLBACK_SELECTORS[key]"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- 缓存设置 -->
        <el-tab-pane label="缓存" name="cache">
          <el-form :model="settings.CACHE_SETTINGS" label-width="120px">
            <el-form-item label="启用缓存">
              <el-switch v-model="settings.CACHE_SETTINGS.ENABLED" />
            </el-form-item>
            <el-form-item label="缓存时间(小时)">
              <el-input-number
                v-model="cacheHours"
                :min="1"
                :max="72"
                @change="updateCacheAge"
              />
            </el-form-item>
            <el-form-item label="最大条目数">
              <el-input-number
                v-model="settings.CACHE_SETTINGS.MAX_ENTRIES"
                :min="100"
                :step="100"
              />
            </el-form-item>
            <el-divider />
            <el-button type="danger" @click="clearCache">
              清除缓存
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveSettings"
          :loading="loading"
        >
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { Config } from '../types';
import { settingsApi } from '../api/settings';
import { cloneDeep } from 'lodash-es';

const props = defineProps<{
  modelValue: boolean;
  settings: Config;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'settings-updated', settings: Config): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const activeTab = ref('ai');
const settings = ref(cloneDeep(props.settings));

const loading = ref(false);
const error = ref<string | null>(null);

// 缓存时间计算
const cacheHours = computed({
  get: () => settings.value.CACHE_SETTINGS.MAX_AGE / (60 * 60 * 1000),
  set: (value) => {
    settings.value.CACHE_SETTINGS.MAX_AGE = value * 60 * 60 * 1000;
  }
});

// 添加服务类型定义
type ServiceKey = keyof typeof props.settings.AI_SETTINGS.SERVICES;
type ServiceConfig = typeof props.settings.AI_SETTINGS.SERVICES[ServiceKey];

// 添加选择器类型定义
type SelectorKey = keyof typeof props.settings.SELECTORS.FALLBACK_SELECTORS;

// 验证设置有效性
function validateSettings(settings: Config): boolean {
  try {
    // 验证 AI 服务配置
    const services = settings.AI_SETTINGS.SERVICES;
    if (!Object.values(services).some(s => s.ENABLED)) {
      throw new Error('至少需要启用一个 AI 服务');
    }

    // 验证缓存配置
    if (settings.CACHE_SETTINGS.MAX_AGE < 0) {
      throw new Error('缓存时间不能为负数');
    }

    // 验证选择器配置
    if (!settings.SELECTORS.TITLE || !settings.SELECTORS.CONTENT) {
      throw new Error('标题和内容选择器不能为空');
    }

    return true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '设置验证失败');
    return false;
  }
}

// 修改保存方法
async function saveSettings() {
  if (!validateSettings(settings.value)) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await settingsApi.updateSettings(settings.value);
    emit('settings-updated', cloneDeep(settings.value));
    ElMessage.success('设置已保存');
    visible.value = false;
  } catch (e) {
    handleError(e);
  } finally {
    loading.value = false;
  }
}

// 修改清除缓存方法
async function clearCache() {
  loading.value = true;
  error.value = null;

  try {
    await settingsApi.clearCache();
    ElMessage.success('缓存已清除');
  } catch (e) {
    handleError(e);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  settings.value = cloneDeep(props.settings);
  visible.value = false;
}

// 添加 updateCacheAge 方法
function updateCacheAge(hours: number) {
  settings.value.CACHE_SETTINGS.MAX_AGE = hours * 60 * 60 * 1000;
}

// 修改错误处理
function handleError(e: unknown) {
  error.value = e instanceof Error ? e.message : '操作失败';
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 0.875rem;
}

.mt-1 {
  margin-top: 0.25rem;
}
</style> 