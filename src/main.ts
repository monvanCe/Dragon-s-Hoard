import '@/style.css'
import { AppBrain } from '@/general/AppBrain'

const mountNode = document.querySelector<HTMLDivElement>('#app')

if (!mountNode) {
  throw new Error('App mount node not found')
}

const brain = new AppBrain()

void brain.bootstrap(mountNode)

window.addEventListener('beforeunload', () => {
  brain.destroy()
})
