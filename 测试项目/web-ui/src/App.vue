<template>
  <el-config-provider :locale="zhCn">
    <div class="app">
      <el-container>
        <!-- 头部导航 -->
        <el-header>
          <div class="header-content">
            <h1>AI 网页内容提取器</h1>
            <div class="header-actions">
              <el-tooltip content="系统状态" placement="bottom">
                <el-badge :value="activeTaskCount" :hidden="activeTaskCount === 0">
                  <el-button circle>
                    <el-icon><Monitor /></el-icon>
                  </el-button>
                </el-badge>
              </el-tooltip>
              <el-tooltip content="帮助文档" placement="bottom">
                <el-button circle @click="showHelp">
                  <el-icon><QuestionFilled /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="系统信息" placement="bottom">
                <el-button circle @click="showSystemInfo">
                  <el-icon><InfoFilled /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </el-header>

        <!-- 主要内容区 -->
        <el-main>
          <task-manager ref="taskManagerRef" @task-count-change="handleTaskCountChange" />
        </el-main>

        <!-- 页脚 -->
        <el-footer>
          <div class="footer-content">
            <span>版本: v1.4.0</span>
            <span>|</span>
            <a href="https://github.com/yourusername/ai-web-extractor" target="_blank">
              GitHub
            </a>
            <span>|</span>
            <el-link type="primary" @click="showSystemInfo">系统信息</el-link>
          </div>
        </el-footer>
      </el-container>

      <!-- 帮助对话框 -->
      <el-dialog
        v-model="helpDialogVisible"
        title="使用帮助"
        width="60%"
      >
        <div class="help-content">
          <el-collapse v-model="activeHelp">
            <el-collapse-item title="基本使用" name="1">
              <ol>
                <li>在输入框中输入要爬取的网址</li>
                <li>点击提交按钮开始爬取</li>
                <li>等待任务完成后查看或下载结果</li>
              </ol>
            </el-collapse-item>
            <el-collapse-item title="AI 服务配置" name="2">
              <p>支持多个 AI 服务：</p>
              <ul>
                <li>OpenAI</li>
                <li>DeepSeek</li>
                <li>Gemini</li>
              </ul>
              <p>可以在系统设置中配置服务优先级和参数。</p>
            </el-collapse-item>
            <el-collapse-item title="常见问题" name="3">
              <el-timeline>
                <el-timeline-item
                  v-for="(qa, index) in faqs"
                  :key="index"
                  :timestamp="qa.q"
                  placement="top"
                >
                  <p>{{ qa.a }}</p>
                </el-timeline-item>
              </el-timeline>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-dialog>

      <!-- 系统信息对话框 -->
      <el-dialog
        v-model="systemInfoVisible"
        title="系统信息"
        width="50%"
      >
        <el-descriptions :column="1" border>
          <el-descriptions-item label="版本">v1.4.0</el-descriptions-item>
          <el-descriptions-item label="运行状态">
            <el-tag :type="systemStatus.type">{{ systemStatus.text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="活跃任务">{{ activeTaskCount }}</el-descriptions-item>
          <el-descriptions-item label="缓存使用">{{ cacheUsage }}</el-descriptions-item>
          <el-descriptions-item label="上次更新">{{ lastUpdateTime }}</el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import TaskManager from './components/TaskManager.vue';
import { Monitor, QuestionFilled, InfoFilled } from '@element-plus/icons-vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 组件引用
const taskManagerRef = ref();
const activeTaskCount = ref(0);
const helpDialogVisible = ref(false);
const systemInfoVisible = ref(false);
const activeHelp = ref(['1']);

// FAQ 数据
const faqs = [
  {
    q: '如何配置 AI 服务？',
    a: '在系统设置中可以配置各个 AI 服务的参数和优先级。'
  },
  {
    q: '为什么任务失败了？',
    a: '可能是网络问题、目标网站限制或 AI 服务暂时不可用，请稍后重试。'
  },
  {
    q: '如何提高成功率？',
    a: '建议配置多个 AI 服务作为备选，并适当调整重试次数和超时时间。'
  }
];

// 系统状态
const systemStatus = computed(() => {
  if (activeTaskCount.value > 0) {
    return { type: 'warning', text: '处理中' };
  }
  return { type: 'success', text: '正常' };
});

// 缓存使用情况
const cacheUsage = ref('0%');
const lastUpdateTime = ref(new Date());

// 更新任务数量
function handleTaskCountChange(count: number) {
  activeTaskCount.value = count;
}

// 显示帮助
function showHelp() {
  helpDialogVisible.value = true;
}

// 显示系统信息
function showSystemInfo() {
  systemInfoVisible.value = true;
  updateSystemInfo();
}

// 更新系统信息
async function updateSystemInfo() {
  try {
    // 这里可以添加获取系统信息的 API 调用
    lastUpdateTime.value = new Date();
  } catch (error) {
    console.error('获取系统信息失败:', error);
  }
}

// 定时更新系统信息
onMounted(() => {
  updateSystemInfo();
  setInterval(updateSystemInfo, 60000); // 每分钟更新一次
});
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100vh;
}

.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.el-main {
  background-color: #f0f2f5;
  flex: 1;
  padding: 20px;
}

.el-footer {
  background-color: #fff;
  border-top: 1px solid #dcdfe6;
  padding: 20px;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  color: #606266;
}

.help-content {
  max-height: 60vh;
  overflow-y: auto;
}

.el-timeline-item {
  padding-bottom: 20px;
}

.el-timeline-item__timestamp {
  font-weight: bold;
  color: #409EFF;
}
</style> 