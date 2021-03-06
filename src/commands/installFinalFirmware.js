// @flow

import { createCommand, Command } from 'helpers/ipc'
import { fromPromise } from 'rxjs/observable/fromPromise'
import { withDevice } from 'helpers/deviceAccess'

import installFinalFirmware from 'helpers/firmware/installFinalFirmware'

type Input = {
  devicePath: string,
  firmware: Object,
}

type Result = {
  targetId: number | string,
  version: string,
  final: boolean,
  mcu: boolean,
}

const cmd: Command<Input, Result> = createCommand(
  'installFinalFirmware',
  ({ devicePath, firmware }) =>
    fromPromise(withDevice(devicePath)(transport => installFinalFirmware(transport, firmware))),
)

export default cmd
