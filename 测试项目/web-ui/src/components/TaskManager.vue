<template>
  <div class="task-manager">
    <el-row :gutter="20" class="mb-4">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
              <div>
                <el-button type="primary" @click="showSettings">
                  系统设置
                </el-button>
                <el-button @click="refreshTasks" :loading="isLoading">
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-title">总任务数</div>
                <div class="stat-value">{{ stats.total }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-title">进行中</div>
                <div class="stat-value">{{ stats.processing }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-title">已完成</div>
                <div class="stat-value">{{ stats.completed }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-title">失败</div>
                <div class="stat-value">{{ stats.failed }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建任务表单 -->
    <el-card class="task-form">
      <template #header>
        <div class="card-header">
          <span>新建爬取任务</span>
        </div>
      </template>
      <el-form :model="form" @submit.prevent="submitTask">
        <el-form-item label="网址">
          <el-input
            v-model="form.url"
            placeholder="请输入要爬取的网址"
            :disabled="isSubmitting"
          >
            <template #append>
              <el-button
                type="primary"
                @click="submitTask"
                :loading="isSubmitting"
              >
                提交
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="task-list">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
        </div>
      </template>
      
      <el-table :data="tasks" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="url" label="网址" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="viewResult(row)"
              :disabled="row.status !== 'completed'"
            >
              查看
            </el-button>
            <el-button
              size="small"
              type="success"
              @click="downloadResult(row)"
              :disabled="row.status !== 'completed'"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 结果查看对话框 -->
    <el-dialog
      v-model="resultDialog.visible"
      :title="resultDialog.title"
      width="70%"
    >
      <div v-if="resultDialog.data" class="result-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">
            {{ resultDialog.data.title }}
          </el-descriptions-item>
          <el-descriptions-item label="内容">
            {{ resultDialog.data.content }}
          </el-descriptions-item>
          <el-descriptions-item label="URL">
            <el-link :href="resultDialog.data.url" target="_blank">
              {{ resultDialog.data.url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ formatDate(resultDialog.data.timestamp) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 设置对话框 -->
    <settings-dialog
      v-model="settingsVisible"
      :settings="settings"
      @settings-updated="handleSettingsUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { scraperApi, type ScrapingTask } from '../api/scraper';
import SettingsDialog from './SettingsDialog.vue';
import { settingsApi } from '../api/settings';
import type { Config } from '../types';

const form = ref({
  url: ''
});

const tasks = ref<ScrapingTask[]>([]);
const isSubmitting = ref(false);
const isLoading = ref(false);
const resultDialog = ref({
  visible: false,
  title: '',
  data: null as ScrapingTask['result'] | null
});

const settingsVisible = ref(false);
const settings = ref<Config>({} as Config);

const stats = computed(() => {
  const total = tasks.value.length;
  const processing = tasks.value.filter(t => t.status === 'processing').length;
  const completed = tasks.value.filter(t => t.status === 'completed').length;
  const failed = tasks.value.filter(t => t.status === 'failed').length;
  
  return { total, processing, completed, failed };
});

// 提交新任务
async function submitTask() {
  if (!form.value.url) {
    ElMessage.warning('请输入网址');
    return;
  }

  isSubmitting.value = true;
  try {
    const task = await scraperApi.submitTask(form.value.url);
    tasks.value.unshift(task);
    form.value.url = '';
    ElMessage.success('任务提交成功');
  } catch (error) {
    ElMessage.error('任务提交失败');
  } finally {
    isSubmitting.value = false;
  }
}

// 刷新任务列表
async function refreshTasks() {
  isLoading.value = true;
  try {
    tasks.value = await scraperApi.getTasks();
  } catch (error) {
    ElMessage.error('获取任务列表失败');
  } finally {
    isLoading.value = false;
  }
}

// 查看结果
async function viewResult(task: ScrapingTask) {
  if (task.result) {
    resultDialog.value = {
      visible: true,
      title: `爬取结果 - ${task.url}`,
      data: task.result
    };
  }
}

// 下载结果
async function downloadResult(task: ScrapingTask) {
  try {
    const blob = await scraperApi.downloadResult(task.id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `result-${task.id}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error('下载失败');
  }
}

// 状态显示
function getStatusType(status: ScrapingTask['status']) {
  const map = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return map[status];
}

function getStatusText(status: ScrapingTask['status']) {
  const map = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return map[status];
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

async function showSettings() {
  try {
    settings.value = await settingsApi.getSettings();
    settingsVisible.value = true;
  } catch (error) {
    ElMessage.error('获取设置失败');
  }
}

function handleSettingsUpdated(newSettings: Config) {
  settings.value = newSettings;
  refreshTasks();
}

onMounted(() => {
  refreshTasks();
});
</script>

<style scoped>
.task-manager {
  padding: 20px;
}

.task-form {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content {
  max-height: 60vh;
  overflow-y: auto;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-title {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409EFF;
}
</style> 