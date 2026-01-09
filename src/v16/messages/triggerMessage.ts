import { z } from "zod";
import { type OcppCall, OcppIncoming } from "../../ocppMessage";
import type { VCP } from "../../vcp";
import { ConnectorIdSchema } from "./_common";
import { bootNotificationOcppMessage } from "./bootNotification";
import { heartbeatOcppMessage } from "./heartbeat";
import { delay } from "../../utils";

const TriggerMessageReqSchema = z.object({
  requestedMessage: z.enum([
    "BootNotification",
    "DiagnosticsStatusNotification",
    "FirmwareStatusNotification",
    "Heartbeat",
    "MeterValues",
    "StatusNotification",
  ]),
  connectorId: ConnectorIdSchema.nullish(),
});
type TriggerMessageReqType = typeof TriggerMessageReqSchema;

const TriggerMessageResSchema = z.object({
  status: z.enum(["Accepted", "Rejected", "NotImplemented"]),
});
type TriggerMessageResType = typeof TriggerMessageResSchema;

const cpVendor = process.env.CP_VENDOR ?? "Solidstudio";
const cpModel = process.env.CP_MODEL ?? "VirtualChargePoint";
const cpSerialN = process.env.CP_SN ?? "VCP-0001";
const cpFwVersion = process.env.CP_FW_VERSION ?? "1.0.0";

class TriggerMessageOcppMessage extends OcppIncoming<
  TriggerMessageReqType,
  TriggerMessageResType
> {
  reqHandler = async (
    vcp: VCP,
    call: OcppCall<z.infer<TriggerMessageReqType>>,
  ): Promise<void> => {
    if (call.payload.requestedMessage === "StatusNotification") {
      vcp.respond(this.response(call, { status: "Accepted" }));
    } else if (call.payload.requestedMessage === "BootNotification") {
      vcp.respond(this.response(call, { status: "Accepted" }));
      await delay(1000);
      vcp.send(bootNotificationOcppMessage.request({
        chargePointVendor: cpVendor, // Configurable via env variables
        chargePointModel: cpModel, // Configurable via env variables
        chargePointSerialNumber: cpSerialN, // Configurable via env variables
        firmwareVersion: cpFwVersion, // Configurable via env variables
      }));
    } else if (call.payload.requestedMessage === "Heartbeat") {
      vcp.respond(this.response(call, { status: "Accepted" }));
      await delay(1000);
      vcp.send(heartbeatOcppMessage.request({}));
    } else {
      vcp.respond(this.response(call, { status: "NotImplemented" }));
    }
  };
}

export const triggerMessageOcppMessage = new TriggerMessageOcppMessage(
  "TriggerMessage",
  TriggerMessageReqSchema,
  TriggerMessageResSchema,
);
