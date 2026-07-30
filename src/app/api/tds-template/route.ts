import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TDS Data Upload');

    // Define columns
    sheet.columns = [
      { header: 'Date of TDS Deduction', key: 'tdsDate', width: 25 },
      { header: 'Date of Invoice / Salary Booked', key: 'invoiceDate', width: 35 },
      { header: 'Name of Business / Individual (as per PAN)', key: 'name', width: 45 },
      { header: 'PAN Number', key: 'pan', width: 20 },
      { header: 'Taxable Amount', key: 'taxable', width: 20 },
      { header: 'TDS Amount', key: 'tdsAmount', width: 20 },
      { header: 'Type of Invoice (Services/Goods)', key: 'type', width: 35 },
      { header: 'Expenses Description', key: 'desc', width: 40 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 30; // Make header taller
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    
    // Add colorful background to headers
    headerRow.eachCell((cell, colNumber) => {
      // Alternate header colors for a vibrant look
      const colors = ['FF0C3866', 'FFFF6B00', 'FF0C3866', 'FFFF6B00', 'FF0C3866', 'FFFF6B00', 'FF0C3866', 'FFFF6B00'];
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors[colNumber - 1] || 'FF0C3866' } 
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });

    // Add a sample data row to guide the user
    const sampleRow = sheet.addRow({
      tdsDate: '15-May-2026',
      invoiceDate: '10-May-2026',
      name: 'Acme Corporation Pvt Ltd',
      pan: 'ABCDE1234F',
      taxable: 50000,
      tdsAmount: 5000,
      type: 'Services',
      desc: 'Annual Consulting Fees'
    });
    
    // Style sample data row
    sampleRow.height = 25;
    sampleRow.font = { italic: true, color: { argb: 'FF555555' }, size: 11 };
    sampleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add alternating row colors for data
    sampleRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F7FA' } // Light grayish blue
      };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    });

    // Lock the header row so it stays visible while scrolling
    sheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="TDS_Upload_Sample.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating template', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
