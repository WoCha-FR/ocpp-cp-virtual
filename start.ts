require("dotenv").config();

import fs from "node:fs";
import { OcppVersion } from "./src/ocppVersion";
import { bootNotificationOcppMessage } from "./src/v16/messages/bootNotification";
import { statusNotificationOcppMessage } from "./src/v16/messages/statusNotification";
import { bootNotificationOcppOutgoing } from "./src/v21/messages/bootNotification";
import { statusNotificationOcppOutgoing } from "./src/v21/messages/statusNotification";
import { VCP } from "./src/vcp";

const cpType = process.env.CP_TYPE ?? "16";
const cpVendor = process.env.CP_VENDOR ?? "Solidstudio";
const cpModel = process.env.CP_MODEL ?? "VirtualChargePoint";
const cpSerialN = process.env.CP_SN ?? "VCP-0001";
const cpFwVersion = process.env.CP_FW_VERSION ?? "1.0.0";
const cpNbSockets = Number.parseInt(process.env.CP_NB_SOCKETS ?? "1");

function createVcp(ocppVersion: OcppVersion): VCP {
  return new VCP({
    endpoint: process.env.WS_URL ?? "ws://localhost:3000",
    chargePointId: process.env.CP_ID ?? "123456",
    ocppVersion: ocppVersion,
    basicAuthPassword: process.env.PASSWORD ?? undefined,
    adminPort: Number.parseInt(process.env.ADMIN_PORT ?? "9999")
  });
}

function sendStatusNotificationsV1(vcp: VCP) {
  for (let i = 1; i <= cpNbSockets; i++) {
    vcp.send(
      statusNotificationOcppMessage.request({
        connectorId: i,
        errorCode: "NoError",
        status: "Available",
      }),
    );
  }
}

function sendStatusNotificationsV2(vcp: VCP) {
  for (let i = 1; i <= cpNbSockets; i++) {
    vcp.send(
      statusNotificationOcppOutgoing.request({
        evseId: 1,
        connectorId: i,
        connectorStatus: "Available",
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

async function start_16() {
  const vcp = createVcp(OcppVersion.OCPP_1_6);
  await vcp.connect();
  vcp.send(
    bootNotificationOcppMessage.request({
      chargePointVendor: cpVendor,
      chargePointModel: cpModel,
      chargePointSerialNumber: cpSerialN,
      firmwareVersion: cpFwVersion
    })
  );
  sendStatusNotificationsV1(vcp);
}

async function start_20() {
  const vcp = createVcp(OcppVersion.OCPP_2_0_1);
  await vcp.connect();
  vcp.send(
    bootNotificationOcppOutgoing.request({
      reason: "PowerUp",
      chargingStation: {
        model: cpModel,
        vendorName: cpVendor,
      },
    }),
  );
  sendStatusNotificationsV2(vcp);
}

async function start_21() {
  const vcp = createVcp(OcppVersion.OCPP_2_1);
  await vcp.connect();
  vcp.send(
    bootNotificationOcppOutgoing.request({
      reason: "PowerUp",
      chargingStation: {
        model: cpModel,
        vendorName: cpVendor,
      },
    }),
  );
  sendStatusNotificationsV2(vcp);
}

(async () => {
  // delete old log file
  fs.unlink("vcp.log", (err) => {
    // ignore error if file does not exist
    if (err && err.code !== "ENOENT") {
      console.error("Error deleting log file:", err);
    }
  });

  if (cpType === "16") {
    await start_16();
  } else if (cpType === "20") {
    await start_20();
  } else if (cpType === "21") {
    await start_21();
  } else {
    throw new Error(`Invalid CP_TYPE: ${cpType}`);
  }
})();