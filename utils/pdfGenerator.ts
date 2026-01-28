import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Verso {
  verse: number;
  text: string;
}

interface Himno {
  title: string;
  number: number;
  lyrics: Verso[];
}

export const generateHimnoHTML = (himno: Himno, fontSize: number = 16): string => {
  const versosHTML = himno.lyrics.map(verso => {
    if (verso.verse === 0) {
      return `
        <div style="margin-bottom: 16px;">
          <p style="color: #FF0000; font-style: italic; font-size: ${fontSize}px; line-height: 1.6; margin: 0;">
            ${verso.text.replace(/\n/g, '<br/>')}
          </p>
        </div>
      `;
    } else {
      return `
        <div style="margin-bottom: 16px;">
          <p style="font-weight: bold; font-size: ${fontSize}px; margin: 0 0 4px 0;">
            ${verso.verse}.
          </p>
          <p style="font-size: ${fontSize}px; line-height: 1.6; margin: 0;">
            ${verso.text.replace(/\n/g, '<br/>')}
          </p>
        </div>
      `;
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            padding-bottom: 60px;
            margin: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .himno-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .himno-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #888;
            padding: 10px;
            border-top: 1px solid #ddd;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="himno-number">Himno #${himno.number}</div>
          <h1 class="himno-title">${himno.title}</h1>
        </div>
        ${versosHTML}
        <div class="footer">
          PDF generado por Alaba+, app en Android & iOS
        </div>
      </body>
    </html>
  `;
};

export const generateMultipleHimnosHTML = (himnos: Himno[], fontSize: number = 16, listName: string = 'Lista'): string => {
  const himnosHTML = himnos.map((himno, index) => {
    const versosHTML = himno.lyrics.map(verso => {
      if (verso.verse === 0) {
        return `
          <div style="margin-bottom: 16px;">
            <p style="color: #FF0000; font-style: italic; font-size: ${fontSize}px; line-height: 1.6; margin: 0;">
              ${verso.text.replace(/\n/g, '<br/>')}
            </p>
          </div>
        `;
      } else {
        return `
          <div style="margin-bottom: 16px;">
            <p style="font-weight: bold; font-size: ${fontSize}px; margin: 0 0 4px 0;">
              ${verso.verse}.
            </p>
            <p style="font-size: ${fontSize}px; line-height: 1.6; margin: 0;">
              ${verso.text.replace(/\n/g, '<br/>')}
            </p>
          </div>
        `;
      }
    }).join('');

    const separator = index < himnos.length - 1 
      ? '<div style="border-top: 2px solid #ddd; margin: 40px 0;"></div>' 
      : '';

    return `
      <div class="himno-section">
        <div class="himno-header">
          <div class="himno-number">Himno #${himno.number}</div>
          <h2 class="himno-title">${himno.title}</h2>
        </div>
        ${versosHTML}
      </div>
      ${separator}
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            padding-bottom: 60px;
            margin: 0;
          }
          .main-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
          }
          .main-title {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .himno-section {
            margin-bottom: 30px;
          }
          .himno-header {
            margin-bottom: 20px;
          }
          .himno-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .himno-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #888;
            padding: 10px;
            border-top: 1px solid #ddd;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="main-header">
          <h1 class="main-title">${listName}</h1>
        </div>
        ${himnosHTML}
        <div class="footer">
          PDF generado por Alaba+, app en Android & iOS
        </div>
      </body>
    </html>
  `;
};

export const generateAndSharePDF = async (html: string, fileName: string): Promise<void> => {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Compartir ${fileName}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      throw new Error('Compartir no está disponible en este dispositivo');
    }
  } catch (error) {
    console.error('Error al generar o compartir PDF:', error);
    throw error;
  }
};
