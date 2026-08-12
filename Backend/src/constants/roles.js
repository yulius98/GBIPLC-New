const UserRole = Object.freeze({
  JEMAAT: 'jemaat',
  PENGURUS: 'pengurus',
  PENDETA: 'pendeta',
});

const ROLES = Object.freeze({
  all: Object.values(UserRole),
  jemaat: [UserRole.JEMAAT],
  pengurus: [UserRole.PENGURUS],
  pendeta: [UserRole.PENDETA],
  jemaatOrPengurus: [UserRole.JEMAAT, UserRole.PENGURUS],
  pengurusOrPendeta: [UserRole.PENGURUS, UserRole.PENDETA],
});

export { UserRole, ROLES };
