// @flow

import { getCryptoCurrencyById } from '@ledgerhq/live-common/lib/helpers/currencies'
import { createCommand, Command } from 'helpers/ipc'
import { fromPromise } from 'rxjs/observable/fromPromise'
import { withDevice } from 'helpers/deviceAccess'
import getAddressForCurrency from 'helpers/getAddressForCurrency'

type Input = {
  currencyId: string,
  devicePath: string,
  path: string,
  verify?: boolean,
  segwit?: boolean,
}

type Result = {
  address: string,
  path: string,
  publicKey: string,
}

const cmd: Command<Input, Result> = createCommand(
  'getAddress',
  ({ currencyId, devicePath, path, ...options }) =>
    fromPromise(
      withDevice(devicePath)(transport =>
        getAddressForCurrency(transport, getCryptoCurrencyById(currencyId), path, options),
      ),
    ),
)

export default cmd
