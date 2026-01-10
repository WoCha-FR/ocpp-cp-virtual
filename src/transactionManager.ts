import type { VCP } from "./vcp";

const POWER = Number.parseFloat(process.env.POWER ?? "1");
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
}

interface StartTransactionProps {
  transactionId: TransactionId;
  idTag: string;
  evseId?: number;
  connectorId: number;
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
      });
    }, METER_VALUES_INTERVAL_SEC * 1000);

    this.transactions.set(startTransactionProps.transactionId, {
      transactionId: startTransactionProps.transactionId,
      idTag: startTransactionProps.idTag,
      meterValue: 0,
      startedAt: new Date(),
      evseId: startTransactionProps.evseId,
      connectorId: startTransactionProps.connectorId,
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
    const chargePower = POWER * 1000; // kW
    const timeMs = (new Date().getTime() - transaction.startedAt.getTime());
    const time = timeMs / 3600000;
    const energy = Math.floor(transaction.meterValue + (chargePower * time));
    return energy;
    //return (new Date().getTime() - transaction.startedAt.getTime()) / 100;
  }

  getConnectorId(transactionId: TransactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return 1;
    }
    return transaction.connectorId;
  }
}
