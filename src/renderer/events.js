// @flow

// FIXME this file is spaghetti. we need one file per usecase.

// TODO to improve current state:
// a sendEventPromise version that returns a promise
// a sendEventObserver version that takes an observer & return a Subscription
// both of these implementation should have a unique requestId to ensure there is no collision
// events should all appear in the promise result / observer msgs as soon as they have this requestId

import 'commands'
import logger from 'logger'

import { ipcRenderer } from 'electron'
import debug from 'debug'

import { CHECK_UPDATE_DELAY } from 'config/constants'

import { setUpdateStatus } from 'reducers/update'

import { addDevice, removeDevice, resetDevices } from 'actions/devices'

import listenDevices from 'commands/listenDevices'

const d = {
  device: debug('lwd:device'),
  sync: debug('lwd:sync'),
  update: debug('lwd:update'),
}

type MsgPayload = {
  type: string,
  data: any,
}

// TODO port remaining to command pattern
export function sendEvent(channel: string, msgType: string, data: any) {
  ipcRenderer.send(channel, {
    type: msgType,
    data,
  })
}

let syncDeviceSub
export default ({ store }: { store: Object, locked: boolean }) => {
  // Ensure all sub-processes are killed before creating new ones (dev mode...)
  ipcRenderer.send('clean-processes')

  if (syncDeviceSub) {
    syncDeviceSub.unsubscribe()
    syncDeviceSub = null
  }

  function syncDevices() {
    syncDeviceSub = listenDevices.send().subscribe(
      ({ device, type }) => {
        if (device) {
          if (type === 'add') {
            d.device('Device - add')
            store.dispatch(addDevice(device))
          } else if (type === 'remove') {
            d.device('Device - remove')
            store.dispatch(removeDevice(device))
          }
        }
      },
      error => {
        logger.warn('listenDevices error', error)
        store.dispatch(resetDevices())
        syncDevices()
      },
      () => {
        logger.warn('listenDevices ended unexpectedly. restarting')
        store.dispatch(resetDevices())
        syncDevices()
      },
    )
  }

  syncDevices()

  if (__PROD__) {
    // TODO move this to "command" pattern
    const updaterHandlers = {
      checking: () => store.dispatch(setUpdateStatus('checking')),
      updateAvailable: info => store.dispatch(setUpdateStatus('available', info)),
      updateNotAvailable: () => store.dispatch(setUpdateStatus('unavailable')),
      error: err => store.dispatch(setUpdateStatus('error', err)),
      downloadProgress: progress => store.dispatch(setUpdateStatus('progress', progress)),
      downloaded: () => store.dispatch(setUpdateStatus('downloaded')),
    }
    ipcRenderer.on('updater', (event: any, payload: MsgPayload) => {
      const { type, data } = payload
      updaterHandlers[type](data)
    })

    // Start check of eventual updates
    checkUpdates()
  }
}

if (module.hot) {
  module.hot.accept('commands', () => {
    ipcRenderer.send('clean-processes')
  })
}

export function checkUpdates() {
  d.update('Update - check')
  setTimeout(() => sendEvent('updater', 'init'), CHECK_UPDATE_DELAY)
}
