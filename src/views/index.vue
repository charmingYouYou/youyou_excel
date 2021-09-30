<template>
  <div class="bg-body">
    <el-aside class="index-el-aside">
      <el-menu :default-active="activeMenu" :router="true">
        <el-menu-item
          v-for="route in allRoute"
          :index="route.path"
          :key="route.path"
        >
          <template v-slot:title>
            <i class="el-icon-document"></i>{{ route.meta?.name }}
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <el-header>{{ activeRoute.meta?.name }}</el-header>
      <router-view></router-view>
    </el-main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from '@vue/runtime-core'
import { useRouter, RouteRecordRaw, useRoute } from 'vue-router'
const activeMenu = ref<string>('')
const allRoute = ref<RouteRecordRaw[]>([])
const activeRoute = computed(() => useRoute())

onMounted(() => {
  const router = useRouter()

  if (router.options.routes[0].children) {
    allRoute.value = router.options.routes[0].children
    activeMenu.value = allRoute.value[0].path
    console.log(allRoute.value, activeMenu.value)
  }
})
</script>

<style lang="scss" scoped>
.bg-body {
  display: flex;
  flex: 1;

  .el-aside {
    border-right: solid 1px #e6e6e6;

    & > ul {
      border-right: none;
    }
  }
}
.el-menu {
  height: 100vh;
}
.el-menu-item i {
  color: var(--el-text-color-secondary);
}

.el-header {
  border-bottom: 1px solid #e6e6e6;
  font-size: 26px;
  display: flex;
  align-items: center;
}
</style>
