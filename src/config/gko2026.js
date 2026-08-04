export const POOMSAE_MAPPING = {
  putih: "Tingkat Dasar (Geup 9-8)",
  kuning: "Tingkat Pemula (Geup 7-6)",
  hijau: "Tingkat Menengah (Geup 5-4)",
  biru: "Tingkat Menengah Atas (Geup 3-2)",
  merah: "Tingkat Lanjut (Geup 1)",
  hitam: "Tingkat Dan (Poomsae Taegeuk/Yudanja)",
};

export const KYORUGI_CLASSES = [
  { minAge: 6, maxAge: 8, minWeight: 0, maxWeight: 25, label: "Kelas Pra-Junior Fin (6-8 th, <25kg)" },
  { minAge: 6, maxAge: 8, minWeight: 25, maxWeight: 999, label: "Kelas Pra-Junior Feather (6-8 th, 25kg+)" },
  { minAge: 9, maxAge: 11, minWeight: 0, maxWeight: 30, label: "Kelas Junior Fin (9-11 th, <30kg)" },
  { minAge: 9, maxAge: 11, minWeight: 30, maxWeight: 999, label: "Kelas Junior Feather (9-11 th, 30kg+)" },
];

export const CONTACT_INFO = {
  Instagram: "@goldenkickerstaekwondo",
  phone: "+62 878-0822-8699",
  email: "sulthan312@gmail.com"
};

export const CATEGORY_CARDS = [
  {
    id: "poomsae",
    title: "Poomsae",
    description: "Jurus dan rangkaian gerakan untuk teknik dan konsentrasi.",
    image: "/poomsae.png",
    hint: "Pilihan tepat untuk peserta yang suka latihan gerakan terstruktur.",
  },
  {
    id: "kyorugi",
    title: "Kyorugi",
    description: "Pertandingan sparring untuk kelas usia dan berat yang sesuai.",
    image: "/kyorugi.png",
    hint: "Pilihan untuk pertandingan tanding yang seru dan dinamis.",
  },
];

export const AGE_WEIGHT_HINT_IMAGE = "/ilustrasi-kelas-berat-badan.png";
