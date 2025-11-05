export const BACKEND_ENDPOINTS = {
  inviteOrphanageAdmin:
    process.env.NEXT_PUBLIC_INVITE_ORPHANAGE_ADMIN_URL ??
    "https://europe-west1-orphancare-93b41.cloudfunctions.net/inviteOrphanageAdmin",
};
