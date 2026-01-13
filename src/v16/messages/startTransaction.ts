require("dotenv").config();

import { z } from "zod";
import {
  type OcppCall,
  type OcppCallResult,
  OcppOutgoing,
} from "../../ocppMessage";
import type { VCP } from "../../vcp";
import { ConnectorIdSchema, IdTagInfoSchema, IdTokenSchema } from "./_common";
import { meterValuesOcppMessage } from "./meterValues";
import { stopTransactionOcppMessage } from "./stopTransaction";
import { statusNotificationOcppMessage } from "./statusNotification";

const POWER = Number.parseFloat(process.env.POWER ?? "7.4");

const StartTransactionReqSchema = z.object({
  connectorId: ConnectorIdSchema,
  idTag: IdTokenSchema,
  meterStart: z.number().int(),
  reservationId: z.number().int().nullish(),
  timestamp: z.string().datetime(),
});
type StartTransactionReqType = typeof StartTransactionReqSchema;

const StartTransactionResSchema = z.object({
  idTagInfo: IdTagInfoSchema,
  transactionId: z.number().int(),
});
type StartTransactionResType = typeof StartTransactionResSchema;

class StartTransactionOcppMessage extends OcppOutgoing<
  StartTransactionReqType,
  StartTransactionResType
> {
  resHandler = async (
    vcp: VCP,
    call: OcppCall<z.infer<StartTransactionReqType>>,
    result: OcppCallResult<z.infer<StartTransactionResType>>,
  ): Promise<void> => {
    /* Valid transaction ? */
    if (result.payload.idTagInfo.status !== "Accepted") {
      vcp.send(
        stopTransactionOcppMessage.request({
          idTag: call.payload.idTag,
          meterStop: 0,
          timestamp: new Date().toISOString(),
          transactionId: result.payload.transactionId,
          reason: "DeAuthorized",
        }),
      );
      return;
    }
    /* Charging Status */
    vcp.send(
      statusNotificationOcppMessage.request({
        connectorId: call.payload.connectorId,
        errorCode: "NoError",
        status: "Charging",
        timestamp: new Date().toISOString(),
      }),
    );
    /* Start Transaction in Transaction Manager */
    vcp.transactionManager.startTransaction(vcp, {
      transactionId: result.payload.transactionId,
      idTag: call.payload.idTag,
      connectorId: call.payload.connectorId,
      maxPower: POWER,
      meterValuesCallback: async (transactionState) => {
        vcp.send(
          meterValuesOcppMessage.request({
            connectorId: call.payload.connectorId,
            transactionId: result.payload.transactionId,
            meterValue: [
              {
                timestamp: new Date().toISOString(),
                sampledValue: [
                  {
                    value: (transactionState.meterValue / 1000).toString(),
                    measurand: "Energy.Active.Import.Register",
                    unit: "kWh",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.maxPower.toString(),
                    measurand: "Power.Offered",
                    unit: "kW",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.actPower.toString(),
                    measurand: "Power.Active.Import",
                    unit: "kW",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.currentOffered.toString(),
                    measurand: "Current.Offered",
                    unit: "A",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.currentL1.toString(),
                    measurand: "Current.Import",
                    unit: "A",
                    phase: "L1",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.currentL2.toString(),
                    measurand: "Current.Import",
                    unit: "A",
                    phase: "L2",
                    context: "Sample.Periodic",
                  },
                  {
                    value: transactionState.currentL3.toString(),
                    measurand: "Current.Import",
                    unit: "A",
                    phase: "L3",
                    context: "Sample.Periodic",
                  },
                ],
              },
            ],
          }),
        );
      },
    });
    /* Meter Values Transaction begin */
    vcp.send(
      meterValuesOcppMessage.request({
        connectorId: call.payload.connectorId,
        transactionId: result.payload.transactionId,
        meterValue: [
          { timestamp: call.payload.timestamp, sampledValue: [
            {
              value: "0",
              measurand: "Energy.Active.Import.Register",
              unit: "kWh",
              context: "Transaction.Begin",
            },
          ]},
        ],
      }),
    );
  };
}

export const startTransactionOcppMessage = new StartTransactionOcppMessage(
  "StartTransaction",
  StartTransactionReqSchema,
  StartTransactionResSchema,
);
