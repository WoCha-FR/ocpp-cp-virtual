import { htmlHeader } from "./ui/header";
import { htmlFooter } from "./ui/footer";

function generateConnectorControls16(connectors: number, cpVendor: string, cpModel: string, cpSerialN: string, cpFwVersion: string): string {
  /* Charger Controls */
  let controlsHtml = `
  <div class="card mb-3">
    <div class="card-body">
      <div class="row">
        <div class="col-12 col-lg-6">
          <div class="btn-group btn-group-sm w-100" role="group" aria-label="Charger Status Controls">
            <button class="btn btn-outline-light" onclick="setStatus(0, 'Available')">Set Globaly Available</button>
            <button class="btn btn-outline-light" onclick="setStatus(0, 'Unavailable')">Set Globaly Unavailable</button>
            <button class="btn btn-outline-light" onclick="sendHeartbeat()">Send Heartbeat</button>
            <button class="btn btn-outline-light" onclick="sendBootNotification()">Send BootNotification</button>
          </div>
        </div>
        <div class="col-12 col-lg-3">
          <form class="row row-cols-lg-auto g-3 align-items-center" onsubmit="event.preventDefault(); sendAuthorize(document.getElementById('idTag').value);">
            <div class="col-12">
              <input type="text" class="form-control form-control-sm" id="idTag" placeholder="Enter idTag" required>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-sm btn-outline-light">Send Authorize</button>
            </div>
          </form>
        </div>
        <div class="col-12 col-lg-3">
          <form class="row row-cols-lg-auto g-3 align-items-center" onsubmit="event.preventDefault(); sendStopTransaction(document.getElementById('stopTransactionId').value);">
            <div class="col-12">
              <input type="text" class="form-control form-control-sm" id="stopTransactionId" placeholder="Enter Transaction ID" required>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-sm btn-outline-light">Send StopTransaction</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <div id="result">&nbsp;</div>
    </div>
  </div>`;
  /* Connectors Controls */
  for (let i = 1; i <= connectors; i++) {
    controlsHtml += `
      <div class="card mb-3">
        <div class="card-header">Connector #${i}</div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-12 col-lg-6">
              <div class="btn-group btn-group-sm w-100" role="group" aria-label="Connector ${i} Status Controls">
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'Available')">Set Available</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'Preparing')">Set Preparing</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'Unavailable')">Set Unavailable</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'Reserved')">Set Reserved</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'SuspendedEV')">Set SuspendedEV</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'SuspendedEVSE')">Set SuspendedEVSE</button>
                <button class="btn btn-outline-light" onclick="setStatus(${i}, 'Finishing')">Set Finishing</button>
              </div>
            </div>
            <div class="col-12 col-lg-3">
              <form class="row row-cols-lg-auto g-3 align-items-center" onsubmit="event.preventDefault(); setStatus(${i}, 'Faulted',document.getElementById('faultCode-${i}').value);">
                <div class="col-12">
                  <select class="form-select form-select-sm" id="faultCode-${i}">
                    <option selected disabled>Select Fault Code</option>
                    <option value="ConnectorLockFailure">Connector Lock Failure</option>
                    <option value="EVCommunicationError">EV Communication Error</option>
                    <option value="GroundFailure">Ground Failure</option>
                    <option value="HighTemperature">High Temperature</option>
                    <option value="InternalError">Internal Error</option>
                    <option value="OverCurrentFailure">Over Current Failure</option>
                    <option value="PowerMeterFailure">Power Meter Failure</option>
                    <option value="PowerSwitchFailure">Power Switch Failure</option>
                    <option value="ReaderFailure">Reader Failure</option>
                    <option value="ResetFailure">Reset Failure</option>
                    <option value="UnderVoltage">Under Voltage</option>
                    <option value="OverVoltage">Over Voltage</option>
                    <option value="WeakSignal">Weak Signal</option>
                  </select>
                </div>
                <div class="col-12">
                  <button type="submit" class="btn btn-sm btn-outline-light">Set Faulted</button>
                </div>
              </form>
            </div>
            <div class="col-12 col-lg-3">
              <form class="row row-cols-lg-auto g-3 align-items-center" onsubmit="event.preventDefault(); sendStartTransaction(${i}, document.getElementById('startIdTag-${i}').value);">
                <div class="col-12">
                  <input type="text" class="form-control form-control-sm" id="startIdTag-${i}" placeholder="Enter idTag" required>
                </div>
                <div class="col-12">
                  <button type="submit" class="btn btn-sm btn-outline-light">Send StartTransaction</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div id="result-${i}">&nbsp;</div>
        </div>
      </div>
    `;
  }
  const constrolsScript = `
    <script>
      async function sendHeartbeat() {
        const resultDivId = 'result';
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending Heartbeat...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'Heartbeat',
              payload: {}
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'Heartbeat sent successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      async function sendAuthorize(idTag) {
        const resultDivId = 'result';
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending authorization...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'Authorize',
              messageId: uuidv4(),
              payload: {
                idTag: idTag
              }
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'Authorization for idTag ' + idTag + ' sent successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      async function sendBootNotification() {
        const resultDivId = 'result';
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending BootNotification...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'BootNotification',
              payload: {
                chargePointVendor: "${cpVendor}",
                chargePointModel: "${cpModel}",
                chargePointSerialNumber: "${cpSerialN}",
                firmwareVersion: "${cpFwVersion}"
              }
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'BootNotification sent successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      async function setStatus(connectorId, status, errorCode = 'NoError') {
        const resultDivId = 'result-' + connectorId;
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'StatusNotification',
              payload: {
                connectorId: connectorId,
                errorCode: errorCode,
                status: status,
                timestamp: new Date().toISOString()
              }
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'Status for connector ' + connectorId + ' set to ' + status + ' successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      async function sendStartTransaction(connectorId, idTag) {
        const resultDivId = 'result-' + connectorId;
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending StartTransaction...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'StartTransaction',
              messageId: uuidv4(),
              payload: {
                connectorId: connectorId,
                idTag: idTag,
                meterStart: 0,
                timestamp: new Date().toISOString()
              }
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'StartTransaction for connector ' + connectorId + ' with idTag ' + idTag + ' sent successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      async function sendStopTransaction(transactionId) {
        const resultDivId = 'result';
        let resultDiv = document.getElementById(resultDivId);
        resultDiv.textContent = 'Sending StopTransaction...';
        try {
          const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'StopTransaction',
              messageId: uuidv4(),
              payload: {
                transactionId: parseInt(transactionId),
                timestamp: new Date().toISOString(),
                meterStop: 2000,
                reason: 'Local'
              }
            })
          });
          if (response.ok) {
            resultDiv.textContent = 'StopTransaction with transaction ID ' + transactionId + ' sent successfully!';
            resultDiv.style.color = 'green';
          } else {
            resultDiv.textContent = 'Error: ' + response.status;
            resultDiv.style.color = 'red';
          }
        } catch (error) {
          resultDiv.textContent = 'Error: ' + error.message;
          resultDiv.style.color = 'red';
        }
        setTimeout(() => { resultDiv.textContent = '\u00A0'; }, 5000);
      }
      function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
      }
    </script>
  `;
  controlsHtml += constrolsScript;
  return controlsHtml;
}

export const adminPage = (chargePointId: string, connectors: number, cpVendor: string, cpModel: string, cpSerialN: string, cpFwVersion: string) => `
${htmlHeader}
<div class="container-fluid text-center bg-body-tertiary mb-3">
  <h2>${chargePointId}</h2>
</div>
<main class="container-fluid">
` + generateConnectorControls16(connectors, cpVendor, cpModel, cpSerialN, cpFwVersion) + `
</main>
${htmlFooter}
`;
