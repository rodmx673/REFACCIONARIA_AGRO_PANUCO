export const printTicket = (data: any) => {
  if (!data) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <html>
      <head>
        <title>Ticket ${data.ticketId}</title>
        <style>
        @page { margin: 0; size: 80mm auto; }
          body { font-family: 'Courier New', Courier, monospace; width: 70mm; margin: 0 auto; padding: 10px; color: #000; font-size: 12px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .header { margin-bottom: 10px; }
          .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 10px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
          .items-table th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 4px; }
          .items-table td { padding: 4px 0; vertical-align: top; }
          .totals { margin-top: 10px; font-size: 12px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-final { font-size: 14px; font-weight: bold; margin-top: 5px; }
          .footer { margin-top: 15px; font-size: 9px; text-align: center; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <h2>FARMER PARTS</h2>
          <p>FPA123456789</p>
          <p>Av. Agrícola 123, Col. Centro, México</p>
          <p>Tel: 123-456-7890</p>
        </div>
        
        <div class="divider"></div>
        
        <div style="font-size: 10px; margin-bottom: 5px;">
          <div><strong>Ticket:</strong> ${data.ticketId}</div>
          <div><strong>Fecha:</strong> ${new Date(data.date).toLocaleString()}</div>
          <div><strong>Cliente:</strong> ${data.customerName}</div>
        </div>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 15%;">Cant</th>
              <th style="width: 60%;">Descripción</th>
              <th style="width: 25%;" class="text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item: any) => `
              <tr>
                <td>${item.quantity}x</td>
                <td>${item.description.substring(0, 20).toUpperCase()}</td>
                <td class="text-right">$${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="totals-row">
            <span>SUBTOTAL</span>
            <span>$${Number(data.subtotal).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>IVA (16%)</span>
            <span>$${Number(data.tax).toFixed(2)}</span>
          </div>
          ${data.discount > 0 ? `
          <div class="totals-row">
            <span>DESCUENTO</span>
            <span>-$${Number(data.discount).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row total-final">
            <span>TOTAL</span>
            <span>$${Number(data.total).toFixed(2)}</span>
          </div>
          <div class="totals-row" style="font-size: 10px; margin-top: 5px;">
            <span>PAGO:</span>
            <span>${data.paymentMethod}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="footer">
          Garantía de 30 días en partes eléctricas. No hay devoluciones en partes usadas.
          <br/><br/>
          ¡Gracias por su compra!
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};