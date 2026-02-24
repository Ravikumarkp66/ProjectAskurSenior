import jsPDF from "jspdf";
import { addWatermarkToAllPages } from "./pdf/addWatermark";

// Watermark/logo removed for compatibility

export function generateResultAnalysisPDF(data) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const leftMargin = 40;
  const rightMargin = 40;

  const pad2 = (n) => String(n).padStart(2, "0");
  const formatDate = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return `${pad2(dt.getDate())}-${pad2(dt.getMonth() + 1)}-${dt.getFullYear()}`;
  };

  const divider = (y) => {
    doc.setDrawColor(160);
    doc.setLineWidth(0.6);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
  };

  const ensureSpace = (y, needed) => {
    if (y + needed <= pageHeight - 70) return y;
    doc.addPage();
    return 50;
  };

  const safeText = (v) => (v === null || v === undefined ? "" : String(v));
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const generatedOn = data?.generatedOn ? new Date(data.generatedOn) : new Date();
  const academicYear = safeText(data?.student?.year || new Date().getFullYear());
  const semester = safeText(data?.student?.semester || "");

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RESULT ANALYSIS REPORT", pageWidth / 2, 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Semester: ${semester}`, pageWidth / 2, 70, { align: "center" });
  doc.text(`Academic Year: ${academicYear}`, pageWidth / 2, 86, { align: "center" });
  doc.text(`Generated On: ${formatDate(generatedOn)}`, pageWidth / 2, 102, { align: "center" });
  divider(118);

  // Student details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("STUDENT DETAILS", leftMargin, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Student Name : ${safeText(data?.student?.name)}`, leftMargin, 160);
  doc.text(`USN          : ${safeText(data?.student?.usn)}`, leftMargin, 176);
  doc.text(`Program      : ${safeText(data?.student?.program)}`, leftMargin, 192);
  divider(210);

  let y = 235;
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];

  subjects.forEach((subj) => {
    y = ensureSpace(y, 220);

    const subjectName = safeText(subj?.name);
    const credits = safeText(subj?.credits);
    const type = safeText(subj?.type);
    const cieRounded = safeText(subj?.cieRounded);
    const cieTheory = safeNum(subj?.theoryContribution);
    const ciePractical = safeNum(subj?.practicalContribution);

    const see = safeNum(subj?.see);
    const seeReduced = subj?.seeReduced !== undefined && subj?.seeReduced !== null ? safeText(subj.seeReduced) : (see / 2).toFixed(1);

    const finalMarks = safeText(subj?.finalMarks);
    const grade = safeText(subj?.grade);
    const gradePoints = safeText(subj?.gradePoints);
    const status = safeText(subj?.status);

    // Subject header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Subject: ${subjectName}`, leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Credits: ${credits}`, leftMargin, y + 16);
    doc.text(`Type: ${type}`, leftMargin + 170, y + 16);
    divider(y + 28);

    // CIE section
    doc.setFont("helvetica", "bold");
    doc.text("CIE", leftMargin, y + 48);
    doc.setFont("helvetica", "normal");
    doc.text("CIE (Internal - 50)", leftMargin, y + 64);

    if (type === 'IPCC') {
      doc.text(`Theory Contribution     : ${cieTheory.toFixed(2)} / 25`, leftMargin, y + 84);
      doc.text(`Practical Contribution  : ${ciePractical.toFixed(2)} / 25`, leftMargin, y + 100);
      doc.setFont("helvetica", "bold");
      doc.text(`Final CIE               : ${cieRounded} / 50`, leftMargin, y + 118);
    } else if (type === 'THEORY_ONLY' || type === 'LOW_THEORY') {
      doc.text(`Theory Contribution     : ${cieRounded} / 50`, leftMargin, y + 84);
      doc.setFont("helvetica", "bold");
      doc.text(`Final CIE               : ${cieRounded} / 50`, leftMargin, y + 104);
    } else if (type === 'LAB_ONLY') {
      doc.text(`Practical Contribution  : ${cieRounded} / 50`, leftMargin, y + 84);
      doc.setFont("helvetica", "bold");
      doc.text(`Final CIE               : ${cieRounded} / 50`, leftMargin, y + 104);
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(`Final CIE               : ${cieRounded} / 50`, leftMargin, y + 92);
    }

    // SEE & Final result
    doc.setFont("helvetica", "bold");
    doc.text("SEE & FINAL RESULT", leftMargin, y + 142);
    doc.setFont("helvetica", "normal");
    doc.text(`SEE                     : ${see} / 100`, leftMargin, y + 160);
    doc.text(`SEE (Reduced)           : ${seeReduced} / 50`, leftMargin, y + 176);
    doc.text(`Final Marks             : ${finalMarks} / 100`, leftMargin, y + 196);
    doc.text(`Grade                   : ${grade}`, leftMargin, y + 212);
    doc.text(`Grade Points            : ${gradePoints}`, leftMargin, y + 228);
    doc.text(`Status                  : ${status}`, leftMargin, y + 244);

    divider(y + 265);
    y += 290;
  });

  // SGPA Summary
  y = ensureSpace(y, 140);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SGPA SUMMARY", leftMargin, y);
  divider(y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total Credits        : ${safeText(data?.totalCredits)}`, leftMargin, y + 34);
  doc.text(`Total Grade Points   : ${safeText(data?.totalPoints)}`, leftMargin, y + 50);
  doc.setFont("helvetica", "bold");
  doc.text(`SGPA                 : ${safeText(data?.sgpa)}`, leftMargin, y + 70);
  divider(y + 86);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const footerText = [
    "Minimum CIE required: 20",
    "Minimum SEE required: 36",
    "NE subjects carry 0 grade points",
    "",
    "Generated by AskUrSenior",
  ];
  doc.text(footerText, pageWidth / 2, pageHeight - 70, { align: "center" });

  addWatermarkToAllPages(doc, {
    opacity: 0.05,
    size: 450,
    rotation: -15,
  });

  doc.save(`Result_Analysis_${safeText(data?.student?.usn || "Student")}.pdf`);
}
