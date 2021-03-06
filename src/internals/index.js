// @flow
import commands from 'commands'
import logger from 'logger'

require('../env')
require('../init-sentry')

process.title = 'Internal'

const subscriptions = {}

process.on('message', m => {
  if (m.type === 'command') {
    const { data, requestId, id } = m.command
    const cmd = commands.find(cmd => cmd.id === id)
    if (!cmd) {
      logger.warn(`command ${id} not found`)
      return
    }
    subscriptions[requestId] = cmd.impl(data).subscribe({
      next: data => {
        process.send({
          type: 'NEXT',
          requestId,
          data,
        })
      },
      complete: () => {
        delete subscriptions[requestId]
        process.send({
          type: 'COMPLETE',
          requestId,
        })
      },
      error: error => {
        logger.warn('Command error:', error)
        delete subscriptions[requestId]
        process.send({
          type: 'ERROR',
          requestId,
          data: {
            ...error,
            name: error && error.name,
            message: error && error.message,
          },
        })
      },
    })
  } else if (m.type === 'command-unsubscribe') {
    const { requestId } = m
    const sub = subscriptions[requestId]
    if (sub) {
      sub.unsubscribe()
      delete subscriptions[requestId]
    }
  }
})

logger.log('Internal process is up!')
