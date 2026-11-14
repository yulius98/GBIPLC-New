import fs from "fs";
import { Router } from "express";
import prisma from "../../utils/prisma.js";
import createCrudController from "../../utils/crudFactory.js";
import AppError from "../../utils/AppError.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import { uploadFields, uploadDocument } from "../../middlewares/upload.js";
import fileUploadService from "../../services/fileUpload.service.js";
import { ROLES } from "../../constants/roles.js";
import settingsController from "../settings/settings.controller.js";
import usersController from "../users/users.controller.js";

/**
 * Modul admin (pengurus): CRUD untuk kelola konten website.
 * Semua akses dibatasi role pengurus.
 */
const router = Router();

const auth = [authenticate, authorize(...ROLES.pengurusOrPendeta)];

const eventController = createCrudController({
  model: prisma.tblEvent,
  orderBy: { tgl_event: "desc" },
  allowedFields: ["tgl_event", "keterangan", "filename"],
  fileFields: { filename: "event" },
  resourceName: "Kegiatan",
  searchFields: ["keterangan"],
  transform: (d) => ({
    ...d,
    tgl_event: d.tgl_event ? new Date(d.tgl_event) : undefined,
  }),
});

const ibadahRayaController = createCrudController({
  model: prisma.tblIbadahRaya,
  orderBy: [{ tgl_ibadah: "desc" }, { ibadah_ke: "asc" }],
  allowedFields: ["tgl_ibadah", "ibadah_ke", "link_ibadah"],
  resourceName: "Ibadah Raya",
  searchFields: ["link_ibadah"],
  transform: (d) => ({
    ...d,
    tgl_ibadah: d.tgl_ibadah ? new Date(d.tgl_ibadah) : undefined,
  }),
});

const readingScheduleController = createCrudController({
  model: prisma.readingSchedule,
  orderBy: { day: "asc" },
  allowedFields: ["day", "morning_passage", "evening_passage"],
  resourceName: "Saat Teduh",
  searchFields: ["morning_passage", "evening_passage"],
  transform: (d) => ({
    ...d,
    day: d.day !== undefined ? Number(d.day) : undefined,
  }),
});

const lifeGroupController = createCrudController({
  model: prisma.tblKomsel,
  // Sama dengan halaman publik /life-group: urut abjad nama komsel
  orderBy: { nama_komsel: "asc" },
  allowedFields: ["nama_komsel", "ketua_komsel", "no_telp", "alamat"],
  resourceName: "Life Group",
  searchFields: ["nama_komsel", "ketua_komsel"],
});

const pastorNoteController = createCrudController({
  model: prisma.tblPastorNote,
  orderBy: { tgl_note: "desc" },
  allowedFields: ["tgl_note", "note", "filename"],
  fileFields: { filename: "saat-teduh" },
  resourceName: "Saat Teduh",
  searchFields: ["tgl_note", "note"],
  transform: (d) => ({
    ...d,
    tgl_note: d.tgl_note ? new Date(d.tgl_note) : undefined,
  }),
});

const carouselController = createCrudController({
  model: prisma.tblCarousel,
  orderBy: { id: "asc" },
  allowedFields: ["tema", "description", "filename"],
  fileFields: { filename: "carousel" },
  resourceName: "Carousel",
  searchFields: ["tema", "description"],
});

// Path file hasil POST /api/chunk-upload: materi-kotbah/<40 hex>.<pdf|ppt|pptx>
const CHUNK_UPLOADED_PATH = /^materi-kotbah\/[a-f0-9]{40}\.(pdf|pptx?)$/;

/**
 * Validasi `filename` hasil chunk upload: path harus sesuai pola yang
 * dihasilkan POST /api/chunk-upload dan file-nya benar-benar ada di disk.
 */
function assertValidChunkFilename(value) {
  const diskPath =
    typeof value === "string" && CHUNK_UPLOADED_PATH.test(value)
      ? fileUploadService.getDiskPath(value)
      : null;
  if (!diskPath || !fs.existsSync(diskPath)) {
    throw new AppError("File materi tidak valid. Unggah ulang file.", 422, {
      filename: ["File materi tidak valid. Unggah ulang file."],
    });
  }
}

const materiKotbahController = createCrudController({
  model: prisma.tblMateriKotbah,
  orderBy: { tgl_kotbah: "desc" },
  allowedFields: ["tgl_kotbah", "judul", "filename"],
  fileFields: { filename: "materi-kotbah" },
  resourceName: "Materi Kotbah",
  searchFields: ["judul"],
  transform: (d, req) => {
    const data = {
      ...d,
      tgl_kotbah: d.tgl_kotbah ? new Date(d.tgl_kotbah) : undefined,
    };

    // File dari multer sudah ditangani crudFactory. Selain itu, `filename` datang
    // sebagai teks (hasil chunk upload) dan harus menunjuk file yang benar-benar ada.
    if (!req.files?.filename?.[0] && "filename" in data) {
      const value = data.filename;
      if (value === null || value === "") {
        delete data.filename;
      } else {
        assertValidChunkFilename(value);
        // Saat edit dan file diganti: hapus file lama.
        const oldFile = req.resource?.old?.filename;
        if (oldFile && oldFile !== value) fileUploadService.deleteFile(oldFile);
      }
    }
    return data;
  },
});

const serviceScheduleController = createCrudController({
  model: prisma.tblServiceSchedule,
  orderBy: { id: "asc" },
  allowedFields: ["service_name", "day_of_week", "opens", "closes"],
  resourceName: "Jadwal Ibadah",
});

const tentangPelayananController = createCrudController({
  model: prisma.tblTentangKamiPelayanan,
  orderBy: { id: "asc" },
  allowedFields: ["icon", "judul", "frekuensi", "deskripsi"],
  resourceName: "Kartu Pelayanan",
  // Validasi panjang deskripsi (maks. 150 karakter, sinkron dengan UI admin)
  transform: (d) => {
    if (typeof d.deskripsi === "string" && d.deskripsi.trim().length > 150) {
      throw new AppError("Deskripsi maksimal 150 karakter", 422);
    }
    return d;
  },
});

// ---------- Kegiatan (event) ----------
router.get("/event", ...auth, eventController.list);
router.post(
  "/event",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  eventController.create,
);
router.get("/event/:id", ...auth, eventController.get);
router.put(
  "/event/:id",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  eventController.update,
);
router.delete("/event/:id", ...auth, eventController.remove);

// ---------- Ibadah Raya ----------
router.get("/ibadahraya", ...auth, ibadahRayaController.list);
router.post("/ibadahraya", ...auth, ibadahRayaController.create);
router.get("/ibadahraya/:id", ...auth, ibadahRayaController.get);
router.put("/ibadahraya/:id", ...auth, ibadahRayaController.update);
router.delete("/ibadahraya/:id", ...auth, ibadahRayaController.remove);

// ---------- Saat Teduh (pastor note) ----------
router.get("/pastornote", ...auth, pastorNoteController.list);
router.post(
  "/pastornote",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  pastorNoteController.create,
);
router.get("/pastornote/:id", ...auth, pastorNoteController.get);
router.put(
  "/pastornote/:id",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  pastorNoteController.update,
);
router.delete("/pastornote/:id", ...auth, pastorNoteController.remove);

// ---------- Carousel (banner) ----------
router.get("/carousel", ...auth, carouselController.list);
router.post(
  "/carousel",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  carouselController.create,
);
router.get("/carousel/:id", ...auth, carouselController.get);
router.put(
  "/carousel/:id",
  ...auth,
  uploadFields([{ name: "filename", maxCount: 1 }]),
  carouselController.update,
);
router.delete("/carousel/:id", ...auth, carouselController.remove);

// ---------- Materi Kotbah Ibadah Raya ----------
router.get("/materi-kotbah", ...auth, materiKotbahController.list);
router.post(
  "/materi-kotbah",
  ...auth,
  uploadDocument([{ name: "filename", maxCount: 1 }]),
  materiKotbahController.create,
);
router.get("/materi-kotbah/:id", ...auth, materiKotbahController.get);
router.put(
  "/materi-kotbah/:id",
  ...auth,
  uploadDocument([{ name: "filename", maxCount: 1 }]),
  materiKotbahController.update,
);
router.delete("/materi-kotbah/:id", ...auth, materiKotbahController.remove);

// ---------- Kelola User ----------
router.get("/users", ...auth, usersController.adminList);
router.put("/users/:id", ...auth, usersController.adminUpdateRole);
router.delete("/users/:id", ...auth, usersController.adminRemove);

// ---------- Life Group (komsel) ----------
router.get("/lifegroup", ...auth, lifeGroupController.list);
router.post("/lifegroup", ...auth, lifeGroupController.create);
router.get("/lifegroup/:id", ...auth, lifeGroupController.get);
router.put("/lifegroup/:id", ...auth, lifeGroupController.update);
router.delete("/lifegroup/:id", ...auth, lifeGroupController.remove);

// ---------- Setting SEO ----------
router.get("/seo", ...auth, settingsController.getSeo);
router.put(
  "/seo",
  ...auth,
  uploadFields([{ name: "og_image", maxCount: 1 }]),
  settingsController.updateSeo,
);

// ---------- Data Gembala (setting, singleton) ----------
router.get("/gembala", ...auth, settingsController.getGembala);
router.put("/gembala", ...auth, settingsController.updateGembala);

// ---------- Tentang Kami (setting: singleton teks + kartu pelayanan multi-row) ----------
router.get("/tentang", ...auth, settingsController.getTentang);
router.put("/tentang", ...auth, settingsController.updateTentang);
router.get("/tentang-pelayanan", ...auth, tentangPelayananController.list);
router.post("/tentang-pelayanan", ...auth, tentangPelayananController.create);
router.get("/tentang-pelayanan/:id", ...auth, tentangPelayananController.get);
router.put(
  "/tentang-pelayanan/:id",
  ...auth,
  tentangPelayananController.update,
);
router.delete(
  "/tentang-pelayanan/:id",
  ...auth,
  tentangPelayananController.remove,
);
// ---------- Jadwal Ibadah (setting, multi-row) ----------
router.get("/schedule", ...auth, serviceScheduleController.list);
router.post("/schedule", ...auth, serviceScheduleController.create);
router.get("/schedule/:id", ...auth, serviceScheduleController.get);
router.put("/schedule/:id", ...auth, serviceScheduleController.update);
router.delete("/schedule/:id", ...auth, serviceScheduleController.remove);

// ---------- Bacaan Alkitab (reading schedule 298 hari) ----------
router.get("/reading", ...auth, readingScheduleController.list);
router.post("/reading", ...auth, readingScheduleController.create);
router.get("/reading/:id", ...auth, readingScheduleController.get);
router.put("/reading/:id", ...auth, readingScheduleController.update);
router.delete("/reading/:id", ...auth, readingScheduleController.remove);

// ---------- Referensi: daftar jemaat (untuk form kunjungan) ----------
router.get("/users", ...auth, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, no_HP: true, email: true },
    orderBy: { name: "asc" },
  });
  return res.json({ status: true, message: "Data ditemukan", data: users });
});

export default router;
