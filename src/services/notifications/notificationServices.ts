import {
  collection,
  doc,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import {
  AppNotification,
  NotificationType,
} from "../../types/Notification";
import { UserRole } from "../../types/User";

const USER_COLLECTION = "usuarios";
const NOTIFICATION_COLLECTION = "notificacoes";
const SOLICITATION_COLLECTION = "solicitacoes";

type NotificationWriter = {
  set: (
    reference: DocumentReference<DocumentData>,
    data: DocumentData
  ) => unknown;
};

type NotificationInput = {
  tipo: NotificationType;
  solicitacaoId: string;
  titulo: string;
  mensagem: string;
};

function getNotificationReference(userId: string, notificationId: string) {
  return doc(
    db,
    USER_COLLECTION,
    userId,
    NOTIFICATION_COLLECTION,
    notificationId
  );
}

function mapNotification(id: string, data: DocumentData): AppNotification {
  return {
    id,
    tipo: data.tipo,
    destinatarioId: data.destinatarioId,
    solicitacaoId: data.solicitacaoId,
    titulo: data.titulo,
    mensagem: data.mensagem,
    lida: data.lida === true,
    criadaEm: data.criadaEm ?? null,
    lidaEm: data.lidaEm ?? null,
  };
}

function getNotificationTimestamp(notification: AppNotification) {
  return notification.criadaEm?.toMillis() ?? 0;
}

function getShiftEndDate(date: string, shift: string): Date | null {
  const [day, month, year] = date.split("/").map(Number);
  const endHour = shift === "TARDE" ? 18 : shift === "NOITE" ? 22 : null;

  if (!day || !month || !year || endHour === null) {
    return null;
  }

  return new Date(year, month - 1, day, endHour, 0, 0);
}

export async function getActiveEmployeeIds(
  excludedUserId?: string
): Promise<string[]> {
  const usersQuery = query(
    collection(db, USER_COLLECTION),
    where("tipoUsuario", "==", "FUNCIONARIO")
  );
  const snapshot = await getDocs(usersQuery);

  return snapshot.docs
    .filter((document) => document.data().statusConta === "ATIVO")
    .map((document) => document.id)
    .filter((userId) => userId !== excludedUserId);
}

export function setNotifications(
  writer: NotificationWriter,
  recipientIds: readonly string[],
  notificationId: string,
  input: NotificationInput
) {
  [...new Set(recipientIds)].forEach((recipientId) => {
    writer.set(getNotificationReference(recipientId, notificationId), {
      ...input,
      destinatarioId: recipientId,
      lida: false,
      criadaEm: serverTimestamp(),
    });
  });
}

export function subscribeUserNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  const notificationsReference = collection(
    db,
    USER_COLLECTION,
    userId,
    NOTIFICATION_COLLECTION
  );

  return onSnapshot(
    notificationsReference,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((document) =>
          mapNotification(document.id, document.data())
        )
        .sort(
          (first, second) =>
            getNotificationTimestamp(second) -
            getNotificationTimestamp(first)
        );

      onData(notifications);
    },
    (error) => onError?.(error)
  );
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  await updateDoc(getNotificationReference(userId, notificationId), {
    lida: true,
    lidaEm: serverTimestamp(),
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  const unreadQuery = query(
    collection(
      db,
      USER_COLLECTION,
      userId,
      NOTIFICATION_COLLECTION
    ),
    where("lida", "==", false)
  );
  const snapshot = await getDocs(unreadQuery);

  for (let index = 0; index < snapshot.docs.length; index += 450) {
    const batch = writeBatch(db);

    snapshot.docs.slice(index, index + 450).forEach((document) => {
      batch.update(document.ref, {
        lida: true,
        lidaEm: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

export async function syncOverdueNotifications(
  userId: string,
  userRole: UserRole
) {
  const overdueQuery = query(
    collection(db, SOLICITATION_COLLECTION),
    where("status", "==", "EM_USO")
  );
  const solicitationsSnapshot = await getDocs(overdueQuery);
  const now = new Date();
  const pendingNotifications: Array<{
    reference: ReturnType<typeof getNotificationReference>;
    solicitationId: string;
  }> = [];

  solicitationsSnapshot.docs.forEach((document) => {
    const data = document.data();
    const shiftEnd = getShiftEndDate(data.dataUtilizacao, data.turno);

    if (!shiftEnd || now.getTime() <= shiftEnd.getTime()) {
      return;
    }

    const isRecipient =
      userRole === "FUNCIONARIO" || data.professorId === userId;

    if (!isRecipient) {
      return;
    }

    pendingNotifications.push({
      reference: getNotificationReference(
        userId,
        `atraso_${document.id}`
      ),
      solicitationId: document.id,
    });
  });

  await Promise.all(
    pendingNotifications.map(
      ({ reference, solicitationId }) =>
        runTransaction(db, async (transaction) => {
          const existingNotification = await transaction.get(reference);

          if (existingNotification.exists()) {
            return;
          }

          transaction.set(reference, {
            tipo: "SOLICITACAO_ATRASADA",
            destinatarioId: userId,
            solicitacaoId: solicitationId,
            titulo: "Devolução em atraso",
            mensagem:
              "A solicitação possui recursos que ainda não foram devolvidos.",
            lida: false,
            criadaEm: serverTimestamp(),
          });
        })
    )
  );
}
