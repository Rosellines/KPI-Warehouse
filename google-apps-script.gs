const SUMMARY_SHEET_NAME = 'Summary';
const SCORES_SHEET_NAME = 'Scores';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, message: 'Payload kosong.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const summarySheet = getOrCreateSheet_(spreadsheet, SUMMARY_SHEET_NAME);
    const scoresSheet = getOrCreateSheet_(spreadsheet, SCORES_SHEET_NAME);

    ensureSummaryHeader_(summarySheet);
    ensureScoresHeader_(scoresSheet);

    const userKey = payload.userKey || 'default';
    const savedAt = payload.savedAt || new Date().toISOString();
    const employees = Array.isArray(payload.employees) ? payload.employees : [];

    clearUserRows_(summarySheet, userKey, 1);
    clearUserRows_(scoresSheet, userKey, 1);

    if (employees.length > 0) {
      const summaryRows = employees.map((employee) => [
        userKey,
        savedAt,
        employee.id,
        employee.originalName || '',
        employee.displayName || '',
        employee.position || '',
        employee.period || '',
        employee.totalScore || 0
      ]);

      summarySheet
        .getRange(summarySheet.getLastRow() + 1, 1, summaryRows.length, summaryRows[0].length)
        .setValues(summaryRows);

      const scoreRows = [];
      employees.forEach((employee) => {
        const scores = Array.isArray(employee.scores) ? employee.scores : [];
        scores.forEach((score, index) => {
          scoreRows.push([
            userKey,
            savedAt,
            employee.id,
            employee.displayName || employee.originalName || '',
            index + 1,
            score === '' ? '' : Number(score)
          ]);
        });
      });

      if (scoreRows.length > 0) {
        scoresSheet
          .getRange(scoresSheet.getLastRow() + 1, 1, scoreRows.length, scoreRows[0].length)
          .setValues(scoreRows);
      }
    }

    return jsonResponse({
      ok: true,
      message: 'Data berhasil disimpan ke Google Sheets.',
      userKey: userKey,
      employeeCount: employees.length
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error.message || 'Terjadi error saat menyimpan ke Google Sheets.'
    });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureSummaryHeader_(sheet) {
  const header = [[
    'userKey',
    'savedAt',
    'employeeId',
    'originalName',
    'displayName',
    'position',
    'period',
    'totalScore'
  ]];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, header[0].length).setValues(header);
    sheet.setFrozenRows(1);
  }
}

function ensureScoresHeader_(sheet) {
  const header = [[
    'userKey',
    'savedAt',
    'employeeId',
    'displayName',
    'scoreIndex',
    'value'
  ]];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, header[0].length).setValues(header);
    sheet.setFrozenRows(1);
  }
}

function clearUserRows_(sheet, userKey, headerRowCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRowCount) return;

  const totalRows = lastRow - headerRowCount;
  const values = sheet.getRange(headerRowCount + 1, 1, totalRows, 1).getValues();

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index][0] === userKey) {
      sheet.deleteRow(index + headerRowCount + 1);
    }
  }
}
