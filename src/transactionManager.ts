import type { VCP } from "./vcp";

const mvis = Number.parseInt(process.env.CP_METER_INTERVALSEC ?? "15");
const METER_VALUES_INTERVAL_SEC = mvis;

type TransactionId = string | number;

interface TransactionState {
  startedAt: Date;
  idTag: string;
  transactionId: TransactionId;
  meterValue: number;
  evseId?: number;
  connectorId: number;
  maxPower: number;
  actPower: number;
  currentOffered: number;
  currentL1: number;
  currentL2: number;
  currentL3: number;
}

interface StartTransactionProps {
  transactionId: TransactionId;
  idTag: string;
  evseId?: number;
  connectorId: number;
  maxPower: number;
  meterValuesCallback: (transactionState: TransactionState) => Promise<void>;
}

export class TransactionManager {
  transactions: Map<
    TransactionId,
    TransactionState & { meterValuesTimer: NodeJS.Timer }
  > = new Map();

  canStartNewTransaction(connectorId: number) {
    return !Array.from(this.transactions.values()).some(
      (transaction) => transaction.connectorId === connectorId,
    );
  }

  startTransaction(vcp: VCP, startTransactionProps: StartTransactionProps) {
    /* Timer callback to send meter values periodically */
    const meterValuesTimer = setInterval(() => {
      // biome-ignore lint/style/noNonNullAssertion: transaction must exist
      const currentTransactionState = this.transactions.get(
        startTransactionProps.transactionId,
      )!;
      const { meterValuesTimer, ...currentTransaction } =
        currentTransactionState;
      startTransactionProps.meterValuesCallback({
        ...currentTransaction,
        meterValue: this.getMeterValue(startTransactionProps.transactionId),
        actPower: currentTransactionState.actPower,
        currentOffered: currentTransactionState.currentOffered,
        currentL1: currentTransactionState.currentL1,
        currentL2: currentTransactionState.currentL2,
        currentL3: currentTransactionState.currentL3,
      });
    }, METER_VALUES_INTERVAL_SEC * 1000);

    this.transactions.set(startTransactionProps.transactionId, {
      transactionId: startTransactionProps.transactionId,
      idTag: startTransactionProps.idTag,
      meterValue: 0,
      startedAt: new Date(),
      evseId: startTransactionProps.evseId,
      connectorId: startTransactionProps.connectorId,
      maxPower: (Math.round(startTransactionProps.maxPower * 10) / 10),
      actPower: this.getActivePower(startTransactionProps.maxPower),
      currentOffered: this.getCurrentOffered(startTransactionProps.maxPower),
      currentL1: this.getCurrentImport(startTransactionProps.maxPower, 1),
      currentL2: this.getCurrentImport(startTransactionProps.maxPower, 2),
      currentL3: this.getCurrentImport(startTransactionProps.maxPower, 3),
      meterValuesTimer: meterValuesTimer,
    });
  }

  stopTransaction(transactionId: TransactionId) {
    const transaction = this.transactions.get(transactionId);
    if (transaction?.meterValuesTimer) {
      clearInterval(Number(transaction.meterValuesTimer));
    }
    this.transactions.delete(transactionId);
  }

  getMeterValue(transactionId: TransactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return 0;
    }
    const chargePower = transaction.actPower * 1000; // kW to W
    const timeMs = (new Date().getTime() - transaction.startedAt.getTime());
    const time = timeMs / 3600000;
    const energy = Math.floor(transaction.meterValue + (chargePower * time));
    return energy;
  }

  getActivePower(maxPower: number) {
    return Math.round((maxPower * 0.95) * 100) / 100
  }

  getCurrentOffered(maxPower: number) {
    if (maxPower <= 7.4) {
      return Math.round((maxPower / 230) * 1000);
    }
    if (maxPower <= 22) {
      return Math.round((maxPower / 690) * 1000);
    }
    return Math.round((maxPower / 415) * 1000);
  }

  getCurrentImport(maxPower: number, phase: 1 | 2 | 3) {
    const activePower = this.getActivePower(maxPower);
    if (phase === 1) {
      if (maxPower <= 7.4) {
        return Math.round((activePower / 230) * 10000) / 10;
      }
      if (maxPower <= 22) {
        return Math.round((activePower / 690) * 10000) / 10;
      }
      return Math.round((activePower / 415) * 10000) / 10;
    }
    if (phase === 2) {
      if (maxPower <= 7.4) {
        return 0;
      }
      if (maxPower <= 22) {
        return Math.round((activePower / 690) * 10000) / 10;
      }
      return Math.round((activePower / 415) * 10000) / 10;
    }
    if (phase === 3) {
      if (maxPower <= 7.4) {
        return 0;
      }
      if (maxPower <= 22) {
        return Math.round((activePower / 690) * 10000) / 10;
      }
      return Math.round((activePower / 415) * 10000) / 10;
    }
    return 0;
  }

  getConnectorId(transactionId: TransactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return 1;
    }
    return transaction.connectorId;
  }
}
