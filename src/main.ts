import { createApp } from 'vue'
import App from './App.vue'
import { installPlatformKeys } from './ui/platform'
import './ui/styles/theme.css'
import './ui/styles/widgets.css'
import './ui/styles/desktop.css'
import { initSkin } from './ui/shell/skin'

initSkin()
installPlatformKeys()
createApp(App).mount('#app')
