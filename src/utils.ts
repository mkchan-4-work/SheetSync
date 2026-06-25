export function generateGoogleAppsScript(webhookId: string, appUrl: string): string {
  const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  return `/**
 * GOOGLE SHEETS WEBHOOK EXTENSION - SYNC SCRIPT
 * 
 * Paste this script in your Google Sheet:
 * 1. Open Google Sheet -> click 'Extensions' -> click 'Apps Script'
 * 2. Delete any default code block and paste this code entirely
 * 3. Save, then click 'Deploy' -> 'New Deployment'
 * 4. Choose type 'Web App' (Gear icon)
 * 5. Set 'Execute as' to 'Me' (your email)
 * 6. Set 'Who has access' to 'Anyone'
 * 7. Click 'Deploy', authorize permissions, and copy the Web App URL
 */

// Associated with Webhook ID: ${webhookId}
// Webhook Dashboard: ${cleanAppUrl}

function doPost(e) {
  try {
    // 1. Parse incoming payload
    var payload;
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else {
      payload = e.parameter || {};
    }

    // Force payload to be a valid object
    if (typeof payload !== 'object' || payload === null) {
      payload = e.parameter || {};
    }

    // 2. Open active sheet and tab
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    // 3. Setup core variables
    var lastColumn = Math.max(1, sheet.getLastColumn());
    var headers = [];
    var lastRow = sheet.getLastRow();

    // 4. Initialize or read existing headers
    if (lastRow === 0) {
      // Empty sheet - initialize headers with Timestamp + payload keys
      headers = ["timestamp"];
      for (var key in payload) {
        if (payload.hasOwnProperty(key)) {
          headers.push(key);
        }
      }
      sheet.appendRow(headers);
      lastRow = 1;
      lastColumn = headers.length;
    } else {
      // Read current row 1 headers
      headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    }

    // 5. Populate row values matching the headers
    var timestamp = new Date();
    var rowData = new Array(headers.length);
    // Column 1 is always Timestamp
    rowData[0] = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    // Map payload attributes to corresponding column indices
    var newColumnsAdded = false;
    for (var fieldName in payload) {
      if (payload.hasOwnProperty(fieldName)) {
        var colIndex = headers.indexOf(fieldName);
        if (colIndex === -1) {
          // New field encountered! Add header to row 1
          headers.push(fieldName);
          sheet.getRange(1, headers.length).setValue(fieldName);
          rowData.push(payload[fieldName]);
          newColumnsAdded = true;
        } else {
          rowData[colIndex] = payload[fieldName];
        }
      }
    }

    // Standardize array length and replace undefineds
    for (var i = 0; i < headers.length; i++) {
      if (rowData[i] === undefined) {
        rowData[i] = "";
      }
    }

    // 6. Write record row to Spreadsheet
    sheet.appendRow(rowData);

    // Return success response to webhook agent
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data appended to Google Sheet successfully",
      headers: headers,
      rowsCount: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return detailed error back
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Enable testing connectivity
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Sheet Sync connection active!",
    sheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}
