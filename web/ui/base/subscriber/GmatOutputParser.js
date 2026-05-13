/**
 * GmatOutputParser.js — Parse GMAT report file output
 *
 * C++ reference: src/base/subscriber/ReportFile.cpp
 */

export class GmatOutputParser {
  static parseReport(text) {
    const lines = text.trim().split('\n');
    const data = { headers: [], rows: [] };
    // Detect delimiter: comma if first non-comment line contains commas
    let delimiter = null;
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('%')) continue;
      delimiter = t.includes(',') ? ',' : /\s{2,}|\t/;
      break;
    }
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('%')) continue;
      const fields = t.split(delimiter).map(s => s.trim()).filter(s => s);
      if (fields.length === 0) continue;
      // First non-comment line with non-numeric last field = headers
      // Use Number() instead of parseFloat() because parseFloat("01 Jan 2000") returns 1
      if (data.headers.length === 0 && isNaN(Number(fields[fields.length - 1]))) {
        data.headers = fields;
      } else {
        data.rows.push(fields.map(f => isNaN(Number(f)) ? f : Number(f)));
      }
    }
    return data;
  }

  static extractPositions(reportData, xCol, yCol, zCol) {
    return reportData.rows.map(row => ({
      x: row[xCol], y: row[yCol], z: row[zCol]
    })).filter(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
  }

  // Extract positions for all spacecraft found in the report headers
  static extractAllSpacecraftPositions(reportData) {
    const results = new Map();
    const headers = reportData.headers;
    const scCols = new Map(); // scName -> {x, y, z}
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      // Match: DefaultSC.CoordSystem.X (any coordinate system)
      const match = h.match(/^(\w+)\.\w+\.([XYZ])$/);
      if (match) {
        const scName = match[1];
        const axis = match[2].toLowerCase();
        if (!scCols.has(scName)) scCols.set(scName, {});
        scCols.get(scName)[axis] = i;
      }
    }
    for (const [scName, cols] of scCols) {
      if (cols.x !== undefined && cols.y !== undefined && cols.z !== undefined) {
        const positions = reportData.rows.map(row => ({
          x: row[cols.x], y: row[cols.y], z: row[cols.z]
        })).filter(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
        if (positions.length > 0) {
          results.set(scName, { positions });
        }
      }
    }
    return results;
  }
}
