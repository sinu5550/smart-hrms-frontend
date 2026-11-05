import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Employee } from "@/services/employee.service";

export type ExportFormat = "excel" | "csv" | "pdf" | "docs";

interface StatusOption {
  value: string;
  label: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Format any date value into requested standard format: "26 Aug, 2003"
 * Safely parses YYYY-MM-DD or ISO strings without timezone day-shift.
 */
export function formatDisplayDate(val?: string | Date | null): string {
  if (!val) return "N/A";
  const str = String(val).trim();
  if (!str) return "N/A";

  const parts = str.slice(0, 10).split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && MONTH_NAMES[m]) {
      return `${d} ${MONTH_NAMES[m]}, ${y}`;
    }
  }

  const dt = new Date(val);
  if (isNaN(dt.getTime())) return str;
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}, ${dt.getFullYear()}`;
}

export async function exportEmployeesData(
  employees: Employee[],
  format: ExportFormat,
  orgName: string = "Enterprise HRMS",
  statusOptions: StatusOption[] = []
) {
  if (!employees || employees.length === 0) {
    alert("No employee data available to export with current filters.");
    return;
  }

  // Create human-friendly lookup map for status labels (e.g. ACTIVE -> PERMANENT, ON_PROBATION -> ON PROBATION)
  const statusLabelMap: Record<string, string> = {
    ACTIVE: "PERMANENT",
    ON_PROBATION: "ON PROBATION",
    RESIGNED: "RESIGNED",
    TERMINATED: "TERMINATED",
    SUSPENDED: "SUSPENDED",
    INTERN: "INTERN",
  };

  statusOptions.forEach((opt) => {
    if (opt.value && opt.label) {
      statusLabelMap[opt.value] = opt.label;
    }
  });

  const getStatusLabel = (statusCode?: string | null) => {
    if (!statusCode) return "N/A";
    if (statusLabelMap[statusCode]) return statusLabelMap[statusCode];
    // fallback: replace underscores with spaces and capitalize
    return statusCode.replace(/_/g, " ");
  };

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Employee_Directory_${timestamp}`;
  const exportDateFormatted = formatDisplayDate(new Date());

  // Build comprehensive data mapping for each employee
  const fullData = employees.map((emp, index) => {
    return {
      "SL": index + 1,
      "Employee ID": emp.employeeId || "",
      "Full Name": emp.fullName || "",
      "Role": emp.role || "",
      "Employment Status": getStatusLabel(emp.status),
      "Department": emp.department?.name || "N/A",
      "Designation": emp.designation?.name || "N/A",
      "Shift": emp.shift ? `${emp.shift.shiftName} (${emp.shift.startTime} - ${emp.shift.endTime})` : "N/A",
      "Email Address": emp.email || "N/A",
      "Phone Number": emp.phone || "N/A",
      "Blood Group": emp.bloodGroup || "N/A",
      "Gender": emp.gender || "N/A",
      "Date of Birth": formatDisplayDate(emp.dateOfBirth),
      "Joining Date": formatDisplayDate(emp.joiningDate),
      "NID / Passport": emp.nidOrPassport || "N/A",
      "Present Address": emp.presentAddress || "N/A",
      "Permanent Address": emp.permanentAddress || "N/A",
      "Emergency Contact Name": emp.emergencyContactName || "N/A",
      "Emergency Contact Phone": emp.emergencyContactPhone || "N/A",
      "Emergency Contact Relation": emp.emergencyContactRelation || "N/A",
      "Attendance Exempt": emp.attendanceExempt ? "Yes" : "No",
    };
  });

  if (format === "excel") {
    // Generate styled Excel with Navy Blue Frozen Header using ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SmartHRM Enterprise";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Employees", {
      views: [{ state: "frozen", ySplit: 1 }], // Freeze header row
    });

    const headers = Object.keys(fullData[0]);

    worksheet.columns = headers.map((header) => {
      const maxLen = Math.max(
        header.length,
        ...fullData.map((row) => String((row as any)[header] || "").length)
      );
      return {
        header,
        key: header,
        width: Math.min(Math.max(maxLen + 3, 12), 40),
      };
    });

    // Style Header Row (Navy Blue background, bold white text, centered, height)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F2744" }, // Rich Deep Navy Blue
      };
      cell.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFFFFFF" }, // White text
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF1E3A5F" } },
        bottom: { style: "medium", color: { argb: "FF0A1B30" } },
        left: { style: "thin", color: { argb: "FF1E3A5F" } },
        right: { style: "thin", color: { argb: "FF1E3A5F" } },
      };
    });

    // Add Data Rows with clean alternating styling
    fullData.forEach((row, idx) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 22;
      const isEven = idx % 2 === 0;

      dataRow.eachCell((cell, colNumber) => {
        cell.font = {
          name: "Segoe UI",
          size: 9.5,
          color: { argb: "FF1E293B" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "center" : "left",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        if (!isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" }, // Soft subtle alternating zebra color
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${fileName}.xlsx`);
  } else if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(fullData);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${fileName}.csv`);
  } else if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Document Title Header
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(`${orgName} - Employee Directory Report`, 40, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${exportDateFormatted} | Total Personnel: ${employees.length}`, 40, 58);

    const headers = [
      "SL",
      "ID",
      "Name",
      "Department",
      "Designation",
      "Status",
      "Phone",
      "Email",
      "Blood",
      "Joining Date",
      "Emergency Contact"
    ];

    const rows = employees.map((emp, index) => [
      index + 1,
      emp.employeeId || "",
      emp.fullName || "",
      emp.department?.name || "N/A",
      emp.designation?.name || "N/A",
      getStatusLabel(emp.status),
      emp.phone || "N/A",
      emp.email || "N/A",
      emp.bloodGroup || "N/A",
      formatDisplayDate(emp.joiningDate),
      emp.emergencyContactPhone ? `${emp.emergencyContactName || ""} (${emp.emergencyContactPhone})` : "N/A"
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85] },
      headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: "bold" }, // Navy Blue Header
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 30, right: 30 },
    });

    doc.save(`${fileName}.pdf`);
  } else if (format === "docs") {
    // Generate clean Microsoft Word compatible HTML Document (.doc) with Navy Blue Header
    const headers = Object.keys(fullData[0] || {});
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${orgName} - Employee Directory</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333333; }
          h2 { color: #0f2744; margin-bottom: 4px; }
          .meta { font-size: 9.5pt; color: #666666; margin-bottom: 16px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #0f2744; color: #ffffff; border: 1px solid #0f2744; padding: 6px 8px; text-align: left; font-size: 9pt; }
          td { border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 8.5pt; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>${orgName} - Employee Directory Records</h2>
        <div class="meta">Export Date: ${exportDateFormatted} | Total Employees: ${employees.length}</div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${fullData
              .map(
                (row) => `
              <tr>
                ${headers.map((h) => `<td>${(row as any)[h] || ""}</td>`).join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    downloadBlob(blob, `${fileName}.doc`);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
