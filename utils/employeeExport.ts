import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Employee } from "@/services/employee.service";

export type ExportFormat = "excel" | "csv" | "pdf" | "docs";

export function exportEmployeesData(employees: Employee[], format: ExportFormat, orgName: string = "Enterprise HRMS") {
  if (!employees || employees.length === 0) {
    alert("No employee data available to export with current filters.");
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Employee_Directory_${timestamp}`;

  // Build comprehensive data mapping for each employee
  const fullData = employees.map((emp, index) => {
    return {
      "SL": index + 1,
      "Employee ID": emp.employeeId || "",
      "Full Name": emp.fullName || "",
      "Role": emp.role || "",
      "Employment Status": emp.status || "",
      "Department": emp.department?.name || "N/A",
      "Designation": emp.designation?.name || "N/A",
      "Shift": emp.shift ? `${emp.shift.shiftName} (${emp.shift.startTime} - ${emp.shift.endTime})` : "N/A",
      "Email Address": emp.email || "N/A",
      "Phone Number": emp.phone || "N/A",
      "Blood Group": emp.bloodGroup || "N/A",
      "Gender": emp.gender || "N/A",
      "Date of Birth": emp.dateOfBirth ? String(emp.dateOfBirth).slice(0, 10) : "N/A",
      "Joining Date": emp.joiningDate ? String(emp.joiningDate).slice(0, 10) : "N/A",
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
    const ws = XLSX.utils.json_to_sheet(fullData);
    // Auto-fit column widths
    const colWidths = Object.keys(fullData[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...fullData.map((row) => String((row as any)[key] || "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
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
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Personnel: ${employees.length}`, 40, 58);

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
      emp.status || "",
      emp.phone || "N/A",
      emp.email || "N/A",
      emp.bloodGroup || "N/A",
      emp.joiningDate ? String(emp.joiningDate).slice(0, 10) : "N/A",
      emp.emergencyContactPhone ? `${emp.emergencyContactName || ""} (${emp.emergencyContactPhone})` : "N/A"
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85] },
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 30, right: 30 },
    });

    doc.save(`${fileName}.pdf`);
  } else if (format === "docs") {
    // Generate clean Microsoft Word compatible HTML Document (.doc)
    const headers = Object.keys(fullData[0] || {});
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${orgName} - Employee Directory</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333333; }
          h2 { color: #047857; margin-bottom: 4px; }
          .meta { font-size: 9.5pt; color: #666666; margin-bottom: 16px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #047857; color: #ffffff; border: 1px solid #047857; padding: 6px 8px; text-align: left; font-size: 9pt; }
          td { border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 8.5pt; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>${orgName} - Employee Directory Records</h2>
        <div class="meta">Export Date: ${new Date().toLocaleDateString()} | Total Employees: ${employees.length}</div>
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
