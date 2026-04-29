const PDFDocument = require('pdfkit');
const { Resend } = require('resend');

const NAVY  = '#1a1f2e';
const BLUE  = '#45A7E8';
const GRAY  = '#555555';
const LGRAY = '#f5f7fa';
const BGRAY = '#e2e8ef';

// ─── PDF ────────────────────────────────────────────────────────────────────

function sectionDivider(doc, label, x, w) {

  doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(7.5)
    .text(label, x, doc.y, { width: w });

  const lineY = doc.y + 1;
  doc.moveTo(x, lineY).lineTo(x + w, lineY)
    .strokeColor(BGRAY).lineWidth(0.75).stroke();
  doc.moveDown(0.5);
}

function infoBox(doc, headerLabel, headerColor, fields, x, y, w, h) {
  doc.rect(x, y, w, h).fillAndStroke(LGRAY, BGRAY);
  doc.rect(x, y, w, 20).fill(headerColor);

  doc.fillColor('white').font('Helvetica-Bold').fontSize(7.5)
    .text(headerLabel, x + 8, y + 6, { width: w - 16 });


  let cy = y + 27;
  fields.forEach(([label, val]) => {
    if (!val) return;
    doc.fillColor(GRAY).font('Helvetica').fontSize(7)
      .text(label.toUpperCase(), x + 8, cy, { width: w - 16 });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5)
      .text(val, x + 8, cy + 9, { width: w - 16, lineBreak: false });
    cy += 25;
  });
}

function generatePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Auto Tech Questionnaire — ${data.name || 'Customer'}`,
        Author: 'Auto Tech Services'
      }
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;   // 612
    const M = 50;
    const CW = W - M * 2;       // 512

    // ── HEADER ──
    doc.rect(0, 0, W, 68).fill(NAVY);
    doc.rect(0, 68, W, 4).fill(BLUE);

    doc.fillColor('white').font('Helvetica-Bold').fontSize(21)
      .text('AUTO TECH', M, 16);

    doc.fillColor(BLUE).font('Helvetica').fontSize(8)
      .text('SERVICES', M, 41);
  

    doc.fillColor('white').font('Helvetica').fontSize(8)
      .text('573-378-7300  |  autotechmo.com', 0, 18, { align: 'right', width: W - M });
    doc.fillColor('rgba(255,255,255,0.55)').fontSize(7.5)
      .text('13431 State Route 52, Versailles, MO 65084', 0, 31, { align: 'right', width: W - M });
    doc.fillColor('rgba(255,255,255,0.75)').fontSize(7.5)
      .text(`Submitted: ${new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
      })}`, 0, 44, { align: 'right', width: W - M });

    // ── TITLE ──
  
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(14)
      .text('VEHICLE SERVICE QUESTIONNAIRE', M, 86, { align: 'center', width: CW });
  
    doc.fillColor(BLUE).font('Helvetica').fontSize(10)
      .text(data.questionnaireType || 'General', M, doc.y + 2, { align: 'center', width: CW });

    doc.moveDown(1.2);

    // ── INFO BOXES (2 col) ──
    const colW = (CW - 14) / 2;
    const boxTop = doc.y;
    const boxH = 130;

    infoBox(doc, 'CUSTOMER INFORMATION', NAVY,
      [
        ['Name',              data.name],
        ['Phone',             data.phone],
        ['Email',             data.email],
        ['Preferred Contact', data.contactPref],
      ],
      M, boxTop, colW, boxH
    );

    infoBox(doc, 'VEHICLE INFORMATION', BLUE,
      [
        ['Vehicle',     [data.year, data.make, data.model].filter(Boolean).join(' ') || null],
        ['Mileage',     data.mileage ? `${data.mileage} miles` : null],
        ['Appointment', data.appointment],
      ],
      M + colW + 14, boxTop, colW, boxH
    );

    doc.y = boxTop + boxH + 16;

    // ── WARNING LIGHTS ──
    if (data.lights && data.lights.length > 0) {
      sectionDivider(doc, 'WARNING LIGHTS', M, CW);

      let lx = M, ly = doc.y;
      const bH = 16;

      data.lights.forEach(light => {
        const tw = doc.font('Helvetica').fontSize(8).widthOfString(light);
        const bW = tw + 18;
        if (lx + bW > M + CW) { lx = M; ly += bH + 5; }
        doc.rect(lx, ly, bW, bH).fill('#fff8e1');
        doc.rect(lx, ly, 3, bH).fill('#f59e0b');
        doc.fillColor('#7a4f00').font('Helvetica').fontSize(8)
          .text(light, lx + 7, ly + 4, { lineBreak: false });
        lx += bW + 6;
      });
      doc.y = ly + bH + 14;
    }

    // ── QUESTIONNAIRE SECTIONS ──
    if (data.sections && data.sections.length > 0) {
      sectionDivider(doc, 'QUESTIONNAIRE RESPONSES', M, CW);

      data.sections.forEach(section => {
        if (doc.y > doc.page.height - 160) doc.addPage();

        // Section header bar
        const sh = 18;
        doc.rect(M, doc.y, CW, sh).fill('#dbeeff');
        doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(8.5)
          .text(section.title, M + 8, doc.y + 4, { width: CW - 16 });
        doc.y += sh + 6;

        section.items.forEach(item => {
          if (doc.y > doc.page.height - 80) doc.addPage();

          if (item.kind === 'checks') {
            let ix = M + 8, iy = doc.y;
            item.values.forEach(val => {
              const tw = doc.font('Helvetica').fontSize(8).widthOfString(val);
              const bW = tw + 18;
              if (ix + bW > M + CW - 4) { ix = M + 8; iy += 17; }
              doc.rect(ix, iy, bW, 15).fillAndStroke('#e8f4fd', BLUE);
              doc.circle(ix + 6, iy + 7.5, 2.5).fill(BLUE);
              doc.fillColor(NAVY).font('Helvetica').fontSize(8)
                .text(val, ix + 12, iy + 4, { lineBreak: false });
              ix += bW + 5;
            });
            doc.y = iy + 22;

          } else if (item.kind === 'radio') {
            if (item.label) {
              doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
                .text(item.label, M + 8, doc.y, { width: CW - 16 });
              doc.moveDown(0.15);
            }
            doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
              .text(`>>  ${item.value}`, M + 8, doc.y, { width: CW - 16 });
            doc.moveDown(0.5);

          } else if (item.kind === 'text') {
            doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
              .text(item.label, M + 8, doc.y, { width: CW - 16 });
            doc.moveDown(0.15);
            doc.rect(M + 8, doc.y, CW - 16, 1).fill(BGRAY);
            doc.moveDown(0.15);
            doc.fillColor(NAVY).font('Helvetica').fontSize(9)
              .text(item.value, M + 8, doc.y, { width: CW - 16 });
            doc.moveDown(0.6);
          }
        });

        doc.moveDown(0.6);
      });
    }

    doc.end();
  });
}

// ─── HANDLER ────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const data = req.body;

    const pdfBuffer = await generatePDF(data);

    const vehicle = [data.year, data.make, data.model].filter(Boolean).join(' ') || 'Unknown Vehicle';
    const subject  = `Questionnaire: ${data.name || 'Customer'} — ${vehicle} — ${data.questionnaireType || ''}`;
    const filename = `questionnaire-${(data.name || 'customer').replace(/\s+/g, '-').toLowerCase()}.pdf`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.FROM_EMAIL  || 'onboarding@resend.dev',
      to:   process.env.SHOP_EMAIL  || 'Service@autotechmo.com',
      subject,
      html: `
        <p>A new vehicle questionnaire was submitted through autotechmo.com.</p>
        <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="color:#888">Customer</td><td><strong>${data.name || '—'}</strong></td></tr>
          <tr><td style="color:#888">Phone</td><td>${data.phone || '—'}</td></tr>
          <tr><td style="color:#888">Vehicle</td><td>${vehicle}</td></tr>
          <tr><td style="color:#888">Type</td><td>${data.questionnaireType || '—'}</td></tr>
          <tr><td style="color:#888">Appointment</td><td>${data.appointment || '—'}</td></tr>
        </table>
        <p style="color:#888;font-size:13px;">Full details are in the attached PDF.</p>
      `,
      attachments: [{ filename, content: pdfBuffer }],
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-questionnaire error:', err);
    res.status(500).json({ error: 'Failed to send questionnaire.' });
  }
};
