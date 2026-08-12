/**
 * Konstanta pemetaan kitab Alkitab (USFM code -> berbagai representasi).
 * Diambil dari ReadingController Laravel lama.
 */

/** USFM -> kode singkat alkitab.mobi (untuk URL konten) */
const bookShortCode = {
  GEN: 'Kej', EXO: 'Kel', LEV: 'Ima', NUM: 'Bil', DEU: 'Ul',
  JOS: 'Yos', JDG: 'Hak', RUT: 'Rut',
  '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Raj', '2KI': '2Raj',
  '1CH': '1Taw', '2CH': '2Taw', EZR: 'Ezr', NEH: 'Neh', EST: 'Est',
  JOB: 'Ayb', PSA: 'Mzm', PRO: 'Ams', ECC: 'Pkh', SNG: 'Kid',
  ISA: 'Yes', JER: 'Yer', LAM: 'Rat', EZK: 'Yeh', DAN: 'Dan',
  HOS: 'Hos', JOL: 'Yoe', AMO: 'Amo', OBA: 'Oba', JON: 'Yun',
  MIC: 'Mi', NAM: 'Nah', HAB: 'Hab', ZEP: 'Zef', HAG: 'Hag',
  ZEC: 'Za', MAL: 'Mal',
  MAT: 'Mat', MRK: 'Mrk', LUK: 'Luk', JHN: 'Yoh', ACT: 'Kis',
  ROM: 'Rom', '1CO': '1Kor', '2CO': '2Kor', GAL: 'Gal', EPH: 'Ef',
  PHP: 'Flp', COL: 'Kol', '1TH': '1Tes', '2TH': '2Tes',
  '1TI': '1Tim', '2TI': '2Tim', TIT: 'Tit', PHM: 'Flm',
  HEB: 'Ibr', JAS: 'Yak', '1PE': '1Pet', '2PE': '2Pet',
  '1JN': '1Yoh', '2JN': '2Yoh', '3JN': '3Yoh', JUD: 'Yud', REV: 'Why',
};

/** USFM -> nama kitab lengkap (untuk tampilan referensi) */
const bookFullName = {
  GEN: 'Kejadian', EXO: 'Keluaran', LEV: 'Imamat', NUM: 'Bilangan', DEU: 'Ulangan',
  JOS: 'Yosua', JDG: 'Hakim-hakim', RUT: 'Rut',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Raja-raja', '2KI': '2 Raja-raja',
  '1CH': '1 Tawarikh', '2CH': '2 Tawarikh', EZR: 'Ezra', NEH: 'Nehemia', EST: 'Ester',
  JOB: 'Ayub', PSA: 'Mazmur', PRO: 'Amsal', ECC: 'Pengkhotbah', SNG: 'Kidung Agung',
  ISA: 'Yesaya', JER: 'Yeremia', LAM: 'Ratapan', EZK: 'Yehezkiel', DAN: 'Daniel',
  HOS: 'Hosea', JOL: 'Yoel', AMO: 'Amos', OBA: 'Obaja', JON: 'Yunus',
  MIC: 'Mikha', NAM: 'Nahum', HAB: 'Habakuk', ZEP: 'Zefanya', HAG: 'Hagai',
  ZEC: 'Zakharia', MAL: 'Maleakhi',
  MAT: 'Matius', MRK: 'Markus', LUK: 'Lukas', JHN: 'Yohanes', ACT: 'Kisah Para Rasul',
  ROM: 'Roma', '1CO': '1 Korintus', '2CO': '2 Korintus', GAL: 'Galatia', EPH: 'Efesus',
  PHP: 'Filipi', COL: 'Kolose', '1TH': '1 Tesalonika', '2TH': '2 Tesalonika',
  '1TI': '1 Timotius', '2TI': '2 Timotius', TIT: 'Titus', PHM: 'Filemon',
  HEB: 'Ibrani', JAS: 'Yakobus', '1PE': '1 Petrus', '2PE': '2 Petrus',
  '1JN': '1 Yohanes', '2JN': '2 Yohanes', '3JN': '3 Yohanes', JUD: 'Yudas', REV: 'Wahyu',
};

/** USFM -> nomor urut kitab (untuk URL audio SABDA.org) */
const bookNumber = {
  GEN: '01', EXO: '02', LEV: '03', NUM: '04', DEU: '05',
  JOS: '06', JDG: '07', RUT: '08',
  '1SA': '09', '2SA': '10', '1KI': '11', '2KI': '12',
  '1CH': '13', '2CH': '14', EZR: '15', NEH: '16', EST: '17',
  JOB: '18', PSA: '19', PRO: '20', ECC: '21', SNG: '22',
  ISA: '23', JER: '24', LAM: '25', EZK: '26', DAN: '27',
  HOS: '28', JOL: '29', AMO: '30', OBA: '31', JON: '32',
  MIC: '33', NAM: '34', HAB: '35', ZEP: '36', HAG: '37',
  ZEC: '38', MAL: '39',
  MAT: '01', MRK: '02', LUK: '03', JHN: '04', ACT: '05',
  ROM: '06', '1CO': '07', '2CO': '08', GAL: '09', EPH: '10',
  PHP: '11', COL: '12', '1TH': '13', '2TH': '14',
  '1TI': '15', '2TI': '16', TIT: '17', PHM: '18',
  HEB: '19', JAS: '20', '1PE': '21', '2PE': '22',
  '1JN': '23', '2JN': '24', '3JN': '25', JUD: '26', REV: '27',
};

/** USFM -> nama folder SABDA.org */
const bookFolder = {
  GEN: 'kejadian', EXO: 'keluaran', LEV: 'imamat', NUM: 'bilangan', DEU: 'ulangan',
  JOS: 'yosua', JDG: 'hakim2', RUT: 'rut',
  '1SA': '1samuel', '2SA': '2samuel', '1KI': '1raja2', '2KI': '2raja2',
  '1CH': '1tawarikh', '2CH': '2tawarikh', EZR: 'ezra', NEH: 'nehemia', EST: 'ester',
  JOB: 'ayub', PSA: 'mazmur', PRO: 'amsal', ECC: 'pengkhotbah', SNG: 'kidung',
  ISA: 'yesaya', JER: 'yeremia', LAM: 'ratapan', EZK: 'yehezkiel', DAN: 'daniel',
  HOS: 'hosea', JOL: 'yoel', AMO: 'amos', OBA: 'obaja', JON: 'yunus',
  MIC: 'mikha', NAM: 'nahum', HAB: 'habakuk', ZEP: 'zefanya', HAG: 'hagai',
  ZEC: 'zakharia', MAL: 'maleakhi',
  MAT: 'matius', MRK: 'markus', LUK: 'lukas', JHN: 'yohanes', ACT: 'kisah',
  ROM: 'roma', '1CO': '1korintus', '2CO': '2korintus', GAL: 'galatia', EPH: 'efesus',
  PHP: 'filipi', COL: 'kolose', '1TH': '1tesalonika', '2TH': '2tesalonika',
  '1TI': '1timotius', '2TI': '2timotius', TIT: 'titus', PHM: 'filemon',
  HEB: 'ibrani', JAS: 'yakobus', '1PE': '1petrus', '2PE': '2petrus',
  '1JN': '1yohanes', '2JN': '2yohanes', '3JN': '3yohanes', JUD: 'yudas', REV: 'wahyu',
};

/** Kitab-kitab Perjanjian Lama */
const oldTestamentBooks = new Set([
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
  '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST',
  'JOB', 'PSA', 'PRO', 'ECC', 'SNG',
  'ISA', 'JER', 'LAM', 'EZK', 'DAN',
  'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
]);

/** USFM -> kode 3 huruf untuk nama file audio SABDA.org */
const audioFileCode = {
  GEN: 'kej', EXO: 'kel', LEV: 'ima', NUM: 'bil', DEU: 'ul_',
  JOS: 'yos', JDG: 'hak', RUT: 'rut',
  '1SA': '1sa', '2SA': '2sa', '1KI': '1ra', '2KI': '2ra',
  '1CH': '1ta', '2CH': '2ta', EZR: 'ezr', NEH: 'neh', EST: 'est',
  JOB: 'ayb', PSA: 'mzm', PRO: 'ams', ECC: 'pkh', SNG: 'kid',
  ISA: 'yes', JER: 'yer', LAM: 'rat', EZK: 'yeh', DAN: 'dan',
  HOS: 'hos', JOL: 'yoe', AMO: 'amo', OBA: 'oba', JON: 'yun',
  MIC: 'mi_', NAM: 'nah', HAB: 'hab', ZEP: 'zef', HAG: 'hag',
  ZEC: 'za_', MAL: 'mal',
  MAT: 'mat', MRK: 'mrk', LUK: 'luk', JHN: 'yoh', ACT: 'kis',
  ROM: 'rom', '1CO': '1ko', '2CO': '2ko', GAL: 'gal', EPH: 'efe',
  PHP: 'flp', COL: 'kol', '1TH': '1te', '2TH': '2te',
  '1TI': '1ti', '2TI': '2ti', TIT: 'tit', PHM: 'flm',
  HEB: 'ibr', JAS: 'yak', '1PE': '1pe', '2PE': '2pe',
  '1JN': '1yo', '2JN': '2yo', '3JN': '3yo', JUD: 'yud', REV: 'why',
};

export {
  bookShortCode,
  bookFullName,
  bookNumber,
  bookFolder,
  oldTestamentBooks,
  audioFileCode,
};
