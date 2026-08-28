import Notification from '../models/Notification.js';

export async function createNotification(payload) {
  const { recipient, actor, type, title, body, thought, comment } = payload;
  if (!recipient || !actor || recipient.toString() === actor.toString()) {
    return null;
  }

  return Notification.create({
    recipient,
    actor,
    type,
    title,
    body,
    thought: thought || null,
    comment: comment || null
  });
}
