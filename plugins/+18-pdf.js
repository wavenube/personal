import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';
import { extractImageThumb } from "@whiskeysockets/baileys";
import axios from 'axios';

const handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (!db.data.chats[m.chat].modohorny && m.isGroup) throw '*[❗] Este comando está desactivado en grupos. Si eres administrador y deseas activarlo, usa el comando #enable modohorny*';
  if (!text) throw `*[❗] Ingresa el nombre de una categoría de hentai. Ejemplo: ${usedPrefix + command} miku*`;
  try {
    m.reply(global.wait);
    const res = await fetch(`https://api.lolhuman.xyz/api/nhentaisearch?apikey=${lolkeysapi}&query=${text}`);
    const json = await res.json();
    const aa = json.result[0].id;
    const data = await nhentaiScraper(aa);
    const pages = [];
    const thumb = `https://external-content.duckduckgo.com/iu/?u=https://t.nhentai.net/galleries/${data.media_id}/thumb.jpg`;
    data.images.pages.map((v, i) => {
      const ext = new URL(v.t).pathname.split('.')[1];
      pages.push(`https://external-content.duckduckgo.com/iu/?u=https://i7.nhentai.net/galleries/${data.media_id}/${i + 1}.${ext}`);
    });
    const buffer = await (await fetch(thumb)).buffer();
    const jpegThumbnail = await extractImageThumb(buffer);
    const imagepdf = await toPDF(pages);
    await conn.sendMessage(m.chat, { document: imagepdf, jpegThumbnail, fileName: data.title.english + '.pdf', mimetype: 'application/pdf' }, { quoted: m });
  } catch {
    throw '*[❗] Error al procesar la solicitud. Intenta de nuevo más tarde.*';
  }
};
handler.command = /^(hentaipdf)$/i;
export default handler;

async function nhentaiScraper(id) {
  const uri = id ? `https://cin.guru/v/${+id}/` : 'https://cin.guru/';
  const html = (await axios.get(uri)).data;
  return JSON.parse(html.split('<script id="__NEXT_DATA__" type="application/json">')[1].split('</script>')[0]).props.pageProps.data;
}

function toPDF(images, opt = {}) {
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(images)) images = [images];
    const buffs = [];
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    for (let x = 0; x < images.length; x++) {
      if (/.webp|.gif/.test(images[x])) continue;
      const data = (await axios.get(images[x], { responseType: 'arraybuffer', ...opt })).data;
      doc.image(data, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
      if (images.length != x + 1) doc.addPage();
    }
    doc.on('data', (chunk) => buffs.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffs)));
    doc.on('error', (err) => reject(err));
    doc.end();
  });
}
