import axios from 'axios';
import https from 'https';
import NodeCache from 'node-cache';
import env from '../config/env.js';
import { bookShortCode, bookFullName, bookNumber, bookFolder, oldTestamentBooks, audioFileCode } from '../constants/bibleBooks.js';

/**
 * Cache in-memory untuk konten pasal alkitab.mobi (7 hari),
 * menggantikan Cache::remember Laravel.
 */
const cache = new NodeCache({
  stdTTL: env.bible.cacheTtlDays * 24 * 60 * 60, // detik
  checkperiod: 60 * 60,
});

const ALKITAB_MOBI_BASE = 'https://alkitab.mobi/tb';
const SABDA_AUDIO_BASE = 'https://media.sabda.org/alkitab_audio/tb_alkitabsuara';

// Akses HTTP mirip Laravel lama (verify_peer false) agar kompatibel
const httpAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Ambil HTML pasal dari alkitab.mobi dengan cache.
 * @param {string} shortCode - kode singkat kitab (mis. 'Kej')
 * @param {string} chapter - nomor pasal
 * @returns {Promise<string>}
 */
async function fetchChapterHtml(shortCode, chapter) {
  const cacheKey = `alkitab_html_${shortCode}_${chapter}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${ALKITAB_MOBI_BASE}/${shortCode}/${chapter}/`;
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      httpsAgent: httpAgent,
      responseType: 'text',
    });
    const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    cache.set(cacheKey, html);
    return html;
  } catch {
    // Jika gagal fetch, kembalikan kerangka kosong agar parsing tetap berjalan
    return '<body></body>';
  }
}

/**
 * Parse HTML alkitab.mobi menjadi daftar ayat.
 * @param {string} html
 * @returns {Array<{verse: number, text: string}>}
 */
function parseVerses(html) {
  const verses = [];
  const regex =
    /<span class="reftext"><a name=v\d+[^>]*>(\d+)<\/a><\/span>\s*<span[^>]*>([^<]+)<\/span>/gs;
  let match;
  while ((match = regex.exec(html)) !== null) {
    verses.push({
      verse: Number.parseInt(match[1], 10),
      text: match[2].trim(),
    });
  }
  return verses;
}

/**
 * Bangun URL audio SABDA.org untuk satu kitab+pasal.
 * Contoh: https://media.sabda.org/alkitab_audio/tb_alkitabsuara/pl/mp3/cd/01_kejadian/01_kej01.mp3
 */
function getAudioUrl(bookCode, chapter) {
  const testament = oldTestamentBooks.has(bookCode) ? 'pl' : 'pb';
  const bookNum = bookNumber[bookCode] || '01';
  const folder = bookFolder[bookCode] || 'kejadian';
  const fileCode = audioFileCode[bookCode] || 'kej';

  // Mazmur (PSA) memakai 3 digit, lainnya 2 digit
  const paddedChapter =
    bookCode === 'PSA'
      ? String(chapter).padStart(3, '0')
      : String(chapter).padStart(2, '0');

  return `${SABDA_AUDIO_BASE}/${testament}/mp3/cd/${bookNum}_${folder}/${bookNum}_${fileCode}${paddedChapter}.mp3`;
}

/**
 * Bangun referensi yang "cantik" untuk satu rentang pasal.
 * Contoh: "Kejadian:5-6" atau "Kejadian:5-Keluaran:6".
 */
function buildReference(parts) {
  const firstPart = parts[0].split('.');
  const lastPart = parts[parts.length - 1].split('.');

  const firstBook = bookFullName[firstPart[0]] || firstPart[0];
  const firstChapter = firstPart[1];
  const lastBook = bookFullName[lastPart[0]] || lastPart[0];
  const lastChapter = lastPart[1];

  if (firstPart[0] === lastPart[0]) {
    return `${firstBook}:${firstChapter}-${lastChapter}`;
  }
  return `${firstBook}:${firstChapter}-${lastBook}:${lastChapter}`;
}

/**
 * Ambil isi satu passage (rentang pasal, mis. "GEN.17-GEN.18").
 * @param {string} passageString
 * @returns {Promise<{data: {reference: string, audioUrl: string[], content: Array}}} 
 */
async function fetchPassage(passageString) {
  const parts = passageString.split('-');
  const allVerses = [];
  const audioUrls = [];

  for (const part of parts) {
    const [bookCode, chapter] = part.split('.');
    const shortCode = bookShortCode[bookCode] || 'Kej';

    audioUrls.push(getAudioUrl(bookCode, chapter));

    const html = await fetchChapterHtml(shortCode, chapter);
    const verses = parseVerses(html);
    allVerses.push(...verses);
  }

  return {
    data: {
      reference: `${buildReference(parts)} (TB)`,
      audioUrl: audioUrls,
      content: allVerses,
    },
  };
}

export function clearCache() {
  return cache.flushAll();
}

export { fetchPassage, getAudioUrl, parseVerses, fetchChapterHtml };
