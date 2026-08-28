export function paginate(query = {}) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
